class FactoryGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sideMenu = document.getElementById('sideMenu');
        this.menuToggle = document.getElementById('menuToggle');
        this.closeBtn = document.getElementById('closeBtn');
        
        // Grid settings
        this.gridSize = 40; // Size of each grid cell in pixels
        this.gridColor = '#3a5a3a';
        this.backgroundColor = '#4a7c59';
        
        // Menu state
        this.menuOpen = true;
        
        // Game state
        this.resources = {
            iron: 8
        };
        
        // Building system
        this.selectedBuilding = null;
        this.buildings = new Map(); // grid position -> building data
        this.deleteMode = false;
        this.buildingTypes = {
            miner: { 
                cost: 5, 
                icon: '⛏️', 
                color: '#8B4513',
                inputs: [],
                outputs: ['right'],
                productionRate: 1, // iron per second
                productionType: 'iron'
            },
            conveyor: { 
                cost: 1, 
                icon: '➡️', 
                color: '#666',
                inputs: ['left'],
                outputs: ['right'],
                speed: 1 // items per second
            },
            submitter: { 
                cost: 2, 
                icon: '📦', 
                color: '#4CAF50',
                inputs: ['left', 'up', 'down'],
                outputs: []
            }
        };
        
        // Game loop for building functionality
        this.lastUpdate = Date.now();
        this.items = new Map(); // For items on conveyors
        this.mousePos = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.draw();
        
        // Initial menu state
        this.updateMenuState();
        this.updateModeDisplay();
        
        // Start game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Menu toggle
        this.menuToggle.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // Close button
        this.closeBtn.addEventListener('click', () => {
            this.closeMenu();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
        
        // Canvas click for building placement
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // Mouse movement for building preview
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        // Building selection
        document.querySelectorAll('.building-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectBuilding(e.currentTarget.dataset.building);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Update building availability
        this.updateBuildingAvailability();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    draw() {
        // Clear canvas with background color
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.drawGrid();
        
        // Draw buildings
        this.drawBuildings();
        
        // Draw items
        this.drawItems();
        
        // Draw building preview if selected
        if (this.selectedBuilding) {
            this.drawBuildingPreview();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    toggleMenu() {
        this.menuOpen = !this.menuOpen;
        this.updateMenuState();
    }
    
    closeMenu() {
        this.menuOpen = false;
        this.updateMenuState();
    }
    
    updateMenuState() {
        if (this.menuOpen) {
            this.sideMenu.classList.remove('closed');
            this.menuToggle.classList.add('hidden');
        } else {
            this.sideMenu.classList.add('closed');
            this.menuToggle.classList.remove('hidden');
            this.menuToggle.classList.remove('rotated');
        }
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to grid coordinates
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        
        if (this.deleteMode) {
            this.deleteBuilding(gridX, gridY);
        } else if (this.selectedBuilding) {
            this.placeBuilding(gridX, gridY);
        } else {
            console.log(`Clicked at grid position: (${gridX}, ${gridY})`);
        }
    }
    
    selectBuilding(buildingType) {
        if (this.buildingTypes[buildingType] && this.canAfford(buildingType)) {
            this.selectedBuilding = buildingType;
            this.deleteMode = false;
            this.updateBuildingSelection();
            this.updateModeDisplay();
            this.draw();
        }
    }
    
    canAfford(buildingType) {
        return this.resources.iron >= this.buildingTypes[buildingType].cost;
    }
    
    placeBuilding(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        
        // Check if position is already occupied
        if (this.buildings.has(key)) {
            return;
        }
        
        // Check if we can afford it
        if (!this.canAfford(this.selectedBuilding)) {
            return;
        }
        
        // Place the building
        this.buildings.set(key, {
            type: this.selectedBuilding,
            x: gridX,
            y: gridY,
            rotation: 0
        });
        
        // Deduct cost
        this.resources.iron -= this.buildingTypes[this.selectedBuilding].cost;
        
        // Update UI
        this.updateResourceDisplay();
        this.updateBuildingAvailability();
        this.draw();
    }
    
    drawBuildings() {
        this.buildings.forEach((building, key) => {
            const pixelPos = this.getPixelPosition(building.x, building.y);
            this.drawBuilding(building, pixelPos.x, pixelPos.y);
        });
    }
    
    drawBuilding(building, x, y) {
        const buildingType = this.buildingTypes[building.type];
        
        // Draw building background
        this.ctx.fillStyle = buildingType.color;
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Draw building border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Draw building icon
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(buildingType.icon, x + this.gridSize/2, y + this.gridSize/2);
    }
    
    drawBuildingPreview() {
        // Get mouse position for preview
        const mousePos = this.getMousePosition();
        if (mousePos) {
            const gridPos = this.getGridPosition(mousePos.x, mousePos.y);
            const pixelPos = this.getPixelPosition(gridPos.gridX, gridPos.gridY);
            
            // Draw building preview
            this.drawBuildingPreviewAt(pixelPos.x, pixelPos.y);
            
            // Draw input/output arrows
            this.drawInputOutputArrows(gridPos.gridX, gridPos.gridY, this.selectedBuilding);
        }
    }
    
    drawBuildingPreviewAt(x, y) {
        const buildingType = this.buildingTypes[this.selectedBuilding];
        
        // Draw semi-transparent building preview
        this.ctx.fillStyle = buildingType.color + '80'; // 50% opacity
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Draw preview border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        this.ctx.setLineDash([]);
        
        // Draw building icon
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(buildingType.icon, x + this.gridSize/2, y + this.gridSize/2);
    }
    
    drawInputOutputArrows(gridX, gridY, buildingType) {
        const building = this.buildingTypes[buildingType];
        const pixelPos = this.getPixelPosition(gridX, gridY);
        
        // Draw input arrows
        building.inputs.forEach(direction => {
            this.drawArrow(pixelPos.x, pixelPos.y, direction, '#4CAF50', true);
        });
        
        // Draw output arrows
        building.outputs.forEach(direction => {
            this.drawArrow(pixelPos.x, pixelPos.y, direction, '#f44336', false);
        });
    }
    
    drawArrow(x, y, direction, color, isInput) {
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;
        const arrowSize = 8;
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        
        let arrowX, arrowY, rotation;
        
        switch (direction) {
            case 'up':
                arrowX = centerX;
                arrowY = centerY - this.gridSize/2 - arrowSize;
                rotation = Math.PI;
                break;
            case 'down':
                arrowX = centerX;
                arrowY = centerY + this.gridSize/2 + arrowSize;
                rotation = 0;
                break;
            case 'left':
                arrowX = centerX - this.gridSize/2 - arrowSize;
                arrowY = centerY;
                rotation = Math.PI/2;
                break;
            case 'right':
                arrowX = centerX + this.gridSize/2 + arrowSize;
                arrowY = centerY;
                rotation = -Math.PI/2;
                break;
        }
        
        // Draw arrow
        this.ctx.save();
        this.ctx.translate(arrowX, arrowY);
        this.ctx.rotate(rotation);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-arrowSize, -arrowSize/2);
        this.ctx.lineTo(-arrowSize, arrowSize/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    getMousePosition() {
        return this.mousePos;
    }
    
    updateBuildingSelection() {
        // Update visual selection in menu
        document.querySelectorAll('.building-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.building === this.selectedBuilding) {
                item.classList.add('selected');
            }
        });
    }
    
    updateResourceDisplay() {
        document.getElementById('ironCount').textContent = this.resources.iron;
    }
    
    updateBuildingAvailability() {
        document.querySelectorAll('.building-item').forEach(item => {
            const buildingType = item.dataset.building;
            if (this.canAfford(buildingType)) {
                item.classList.remove('disabled');
            } else {
                item.classList.add('disabled');
            }
        });
    }
    
    handleKeyPress(e) {
        if (e.key === 'Escape') {
            this.selectedBuilding = null;
            this.deleteMode = false;
            this.updateBuildingSelection();
            this.updateModeDisplay();
            this.canvas.style.cursor = 'crosshair';
            this.draw();
        } else if (e.key === 'd' || e.key === 'D') {
            this.toggleDeleteMode();
        }
    }
    
    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        this.selectedBuilding = null;
        this.updateBuildingSelection();
        this.updateModeDisplay();
        this.canvas.style.cursor = this.deleteMode ? 'not-allowed' : 'crosshair';
        this.draw();
    }
    
    deleteBuilding(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        const building = this.buildings.get(key);
        
        if (building) {
            // Refund half the cost
            const refund = Math.floor(this.buildingTypes[building.type].cost / 2);
            this.resources.iron += refund;
            
            // Remove building
            this.buildings.delete(key);
            
            // Update UI
            this.updateResourceDisplay();
            this.updateBuildingAvailability();
            this.draw();
        }
    }
    
    updateModeDisplay() {
        const buildMode = document.getElementById('buildMode');
        const deleteMode = document.getElementById('deleteMode');
        
        buildMode.classList.remove('active');
        deleteMode.classList.remove('delete-active');
        
        if (this.deleteMode) {
            deleteMode.classList.add('delete-active');
        } else {
            buildMode.classList.add('active');
        }
    }
    
    // Method to get grid coordinates from pixel coordinates
    getGridPosition(x, y) {
        return {
            gridX: Math.floor(x / this.gridSize),
            gridY: Math.floor(y / this.gridSize)
        };
    }
    
    // Method to get pixel coordinates from grid coordinates
    getPixelPosition(gridX, gridY) {
        return {
            x: gridX * this.gridSize,
            y: gridY * this.gridSize
        };
    }
    
    // Game loop for building functionality
    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;
        
        this.updateBuildings(deltaTime);
        this.updateItems(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateBuildings(deltaTime) {
        this.buildings.forEach((building, key) => {
            this.updateBuilding(building, deltaTime);
        });
    }
    
    updateBuilding(building, deltaTime) {
        const buildingType = this.buildingTypes[building.type];
        
        switch (building.type) {
            case 'miner':
                this.updateMiner(building, buildingType, deltaTime);
                break;
            case 'conveyor':
                this.updateConveyor(building, buildingType, deltaTime);
                break;
            case 'submitter':
                this.updateSubmitter(building, buildingType, deltaTime);
                break;
        }
    }
    
    updateMiner(building, buildingType, deltaTime) {
        // Produce iron over time
        if (!building.lastProduction) {
            building.lastProduction = Date.now();
        }
        
        const timeSinceLastProduction = (Date.now() - building.lastProduction) / 1000;
        if (timeSinceLastProduction >= 1 / buildingType.productionRate) {
            // Try to output iron
            const outputPos = this.getOutputPosition(building, buildingType.outputs[0]);
            if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`)) {
                // Create iron item
                this.items.set(`${outputPos.x},${outputPos.y}`, {
                    type: buildingType.productionType,
                    x: outputPos.x,
                    y: outputPos.y,
                    progress: 0
                });
                building.lastProduction = Date.now();
            }
        }
    }
    
    updateConveyor(building, buildingType, deltaTime) {
        // Move items along conveyor
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item) {
            item.progress += buildingType.speed * deltaTime;
            
            if (item.progress >= 1) {
                // Move to next position
                const nextPos = this.getOutputPosition(building, buildingType.outputs[0]);
                if (nextPos) {
                    this.items.delete(key);
                    this.items.set(`${nextPos.x},${nextPos.y}`, {
                        ...item,
                        x: nextPos.x,
                        y: nextPos.y,
                        progress: 0
                    });
                } else {
                    // No output, remove item
                    this.items.delete(key);
                }
            }
        }
    }
    
    updateSubmitter(building, buildingType, deltaTime) {
        // Collect items from inputs
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item) {
            // Add to resources
            this.resources[item.type] = (this.resources[item.type] || 0) + 1;
            this.items.delete(key);
            this.updateResourceDisplay();
        }
    }
    
    getOutputPosition(building, direction) {
        let newX = building.x;
        let newY = building.y;
        
        switch (direction) {
            case 'up':
                newY -= 1;
                break;
            case 'down':
                newY += 1;
                break;
            case 'left':
                newX -= 1;
                break;
            case 'right':
                newX += 1;
                break;
        }
        
        return { x: newX, y: newY };
    }
    
    updateItems(deltaTime) {
        // Items are updated in building update methods
    }
    
    drawItems() {
        this.items.forEach((item, key) => {
            const pixelPos = this.getPixelPosition(item.x, item.y);
            this.drawItem(item, pixelPos.x, pixelPos.y);
        });
    }
    
    drawItem(item, x, y) {
        // Draw item as a small circle
        this.ctx.fillStyle = item.type === 'iron' ? '#C0C0C0' : '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw item border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FactoryGame();
});

