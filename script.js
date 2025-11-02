class FactoryGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.buildingMenu = document.getElementById('buildingMenu');
        this.menuToggle = document.getElementById('menuToggle');
        this.closeBtn = document.getElementById('closeBuildingMenu');
        this.deleteOverlay = document.getElementById('deleteOverlay');
        
        // Grid settings
        this.gridSize = 40; // Size of each grid cell in pixels
        this.gridColor = '#3a5a3a';
        this.backgroundColor = '#4a7c59';
        
        // Menu state
        this.menuOpen = false;
        this.deleteMode = false;
        
        // Tutorial state
        this.tutorialActive = false;
        this.tutorialStep = 0;
        this.holograms = [];
        this.tutorialCompleted = false;
        
        // Sound system
        this.sounds = {
            place: this.createSound(200, 0.1, 'sine'),
            delete: this.createSound(150, 0.1, 'sawtooth'),
            research: this.createSound(400, 0.2, 'triangle'),
            collect: this.createSound(600, 0.05, 'square'),
            error: this.createSound(100, 0.3, 'sawtooth')
        };
        this.soundEnabled = true;
        
        // Game state
        this.resources = {
            iron: 8,
            copper: 0,
            ironRod: 0,
            copperRod: 0,
            steel: 0,
            gear: 0,
            circuit: 0,
            motor: 0,
            computer: 0,
            robot: 0,
            power: 0, // New power resource
            coal: 5, // Starting coal for power generation
            uranium: 0, // Fuel for nuclear reactors
            gold: 0 // New gold resource for electronics
        };
        
        // Power system
        this.powerGrid = {
            totalProduction: 0,
            totalConsumption: 0,
            efficiency: 1.0 // Multiplier for production rates based on power
        };
        
        // Discovery system
        this.discoveredItems = new Set(['iron', 'coal']); // Start with iron and coal discovered
        
        // Research system
        this.researchLevel = 0;
        this.researchProgress = 0;
        this.lastResearchClick = 0; // Prevent spam clicking
        this.researchRequirements = {
            1: { items: { iron: 10 }, unlocks: ['copperMiner', 'roller'] },
            2: { items: { copper: 5, ironRod: 3 }, unlocks: ['furnace', 'storage', 'coalGenerator'] },
            3: { items: { steel: 2, copperRod: 2 }, unlocks: ['assembler', 'solarPanel', 'goldMiner'] },
            4: { items: { gear: 1, steel: 5 }, unlocks: ['advancedMiner', 'splitter'] },
            5: { items: { gear: 3, steel: 10 }, unlocks: ['factory', 'lab'] },
            6: { items: { circuit: 2, motor: 1 }, unlocks: ['circuitFactory', 'motorFactory', 'nuclearReactor'] },
            7: { items: { computer: 1, robot: 1 }, unlocks: ['computerFactory', 'robotFactory'] },
            8: { items: { robot: 5, computer: 3 }, unlocks: ['quantumLab', 'timeMachine'] }
        };
        
        // Building system
        this.selectedBuilding = null;
        this.selectedBuildingRotation = 0; // 0, 1, 2, 3 for 0°, 90°, 180°, 270°
        this.buildings = new Map(); // grid position -> building data
        this.deleteMode = false;
        this.buildingTypes = {
            ironMiner: { 
                cost: 5, 
                icon: '⛏️', 
                color: '#8B4513',
                inputs: [],
                outputs: ['right'],
                productionRate: 1, // iron per second
                productionType: 'iron',
                powerConsumption: 0, // No power needed initially
                name: 'Iron Miner',
                description: 'Extracts iron from the ground. Produces 1 iron per second. Outputs to the right.'
            },
            copperMiner: { 
                cost: 10, 
                icon: '⛏️', 
                color: '#B87333',
                inputs: [],
                outputs: ['right'],
                productionRate: 0.8, // copper per second
                productionType: 'copper',
                powerConsumption: 0, // No power needed initially
                name: 'Copper Miner',
                description: 'Extracts copper from the ground. Produces 0.8 copper per second. Outputs to the right.'
            },
            goldMiner: { 
                cost: 15, 
                costItems: { iron: 10, gear: 2 }, // Special cost requiring gears
                icon: '⛏️', 
                color: '#FFD700',
                inputs: [],
                outputs: ['right'],
                productionRate: 0.3, // gold per second
                productionType: 'gold',
                powerConsumption: 3, // Requires power
                name: 'Gold Miner',
                description: 'Extracts gold from the ground. Produces 0.3 gold per second. Outputs to the right. Requires 3 power. Costs 10 iron + 2 gears.'
            },
            conveyor: { 
                cost: 1, 
                icon: '➡️', 
                color: '#666',
                inputs: ['left'],
                outputs: ['right'],
                speed: 1, // items per second
                powerConsumption: 0, // No power needed initially
                name: 'Conveyor Belt',
                description: 'Transports items from left to right at 1 item per second. Essential for automation.'
            },
            roller: { 
                cost: 7, 
                icon: '⚙️', 
                color: '#FF6B35',
                inputs: ['left'],
                outputs: ['right'],
                productionRate: 0.5, // rods per second
                name: 'Roller',
                description: 'Rolls copper into copper rods and iron into iron rods. Processes 0.5 items per second.'
            },
            storage: { 
                cost: 3, 
                icon: '📦', 
                color: '#4A90E2',
                inputs: ['left', 'up', 'down', 'right'],
                outputs: ['left', 'up', 'down', 'right'],
                capacity: 10,
                powerConsumption: 0, // No power needed
                name: 'Storage Container',
                description: 'Stores up to 10 items. Can input and output from all directions.'
            },
            furnace: { 
                cost: 5, 
                icon: '🔥', 
                color: '#FF4500',
                inputs: ['left'],
                outputs: ['right'],
                productionRate: 0.3, // steel per second
                powerConsumption: 3, // Requires power
                name: 'Furnace',
                description: 'Smelts iron into steel. Requires iron input and produces steel output. Requires 3 power.'
            },
            assembler: { 
                cost: 8, 
                icon: '⚙️', 
                color: '#8B008B',
                inputs: ['left', 'up'],
                outputs: ['right'],
                productionRate: 0.2, // gears per second
                powerConsumption: 4, // Requires power
                name: 'Assembler',
                description: 'Assembles iron rods and copper rods into gears. Requires both inputs. Requires 4 power.'
            },
            advancedMiner: { 
                cost: 15, 
                costItems: { iron: 20, gear: 5, steel: 3 }, // Special cost requiring multiple items
                icon: '⛏️', 
                color: '#FFD700',
                inputs: [],
                outputs: ['right'],
                productionRate: 2, // items per second
                productionType: 'iron',
                powerConsumption: 5, // Requires power
                name: 'Advanced Miner',
                description: 'High-tech miner that produces 2 iron per second. Requires research level 4. Requires 5 power. Costs 20 iron + 5 gears + 3 steel.'
            },
            splitter: { 
                cost: 5, 
                icon: '↔️', 
                color: '#9370DB',
                inputs: ['left'],
                outputs: ['right', 'up', 'down'],
                powerConsumption: 1, // Requires power
                name: 'Item Splitter',
                description: 'Splits incoming items to multiple outputs. Requires research level 4. Requires 1 power.'
            },
            factory: { 
                cost: 25, 
                icon: '🏭', 
                color: '#FF6347',
                inputs: ['left', 'up'],
                outputs: ['right'],
                productionRate: 1, // items per second
                powerConsumption: 8, // Requires power
                name: 'Advanced Factory',
                description: 'Produces advanced components from multiple inputs. Requires research level 5. Requires 8 power.'
            },
            lab: { 
                cost: 20, 
                icon: '🧪', 
                color: '#00CED1',
                inputs: ['left', 'up', 'down'],
                outputs: ['right'],
                productionRate: 0.1, // research points per second
                powerConsumption: 6, // Requires power
                name: 'Research Lab',
                description: 'Generates research points for unlocking new technologies. Requires research level 5. Requires 6 power.'
            },
             submitter: { 
                 cost: 2, 
                 icon: '📤', 
                 color: '#4CAF50',
                 inputs: ['left', 'up', 'down', 'right'],
                 outputs: [],
                 name: 'Resource Submitter',
                 description: 'Collects items from all directions and converts them back to resources. Accepts inputs from all sides.'
             },
             circuitFactory: { 
                 cost: 12, 
                 costItems: { iron: 15, gear: 3, steel: 5 }, // Special cost requiring multiple items
                 icon: '🔌', 
                 color: '#FF69B4',
                 inputs: ['left', 'up'],
                 outputs: ['right'],
                 productionRate: 0.3,
                 powerConsumption: 5, // Requires power
                 name: 'Circuit Factory',
                 description: 'Produces circuits from gold and steel. Requires research level 6. Requires 5 power. Costs 15 iron + 3 gears + 5 steel.'
             },
             motorFactory: { 
                 cost: 15, 
                 costItems: { iron: 20, gear: 8, steel: 8 }, // Special cost requiring multiple items
                 icon: '🔧', 
                 color: '#FFD700',
                 inputs: ['left', 'up'],
                 outputs: ['right'],
                 productionRate: 0.2,
                 powerConsumption: 6, // Requires power
                 name: 'Motor Factory',
                 description: 'Produces motors from steel and gears. Requires research level 6. Requires 6 power. Costs 20 iron + 8 gears + 8 steel.'
             },
             computerFactory: { 
                 cost: 30, 
                 costItems: { iron: 50, gear: 15, steel: 20, circuit: 5 }, // Special cost requiring multiple items
                 icon: '💻', 
                 color: '#00BFFF',
                 inputs: ['left', 'up', 'down'],
                 outputs: ['right'],
                 productionRate: 0.1,
                 powerConsumption: 10, // Requires power
                 name: 'Computer Factory',
                 description: 'Produces computers from circuits and motors. Requires research level 7. Requires 10 power. Costs 50 iron + 15 gears + 20 steel + 5 circuits.'
             },
             robotFactory: { 
                 cost: 40, 
                 costItems: { iron: 100, gear: 25, steel: 30, circuit: 10, motor: 3 }, // Special cost requiring multiple items
                 icon: '🤖', 
                 color: '#FF4500',
                 inputs: ['left', 'up', 'down'],
                 outputs: ['right'],
                 productionRate: 0.05,
                 powerConsumption: 15, // Requires power
                 name: 'Robot Factory',
                 description: 'Produces robots from computers and motors. Requires research level 7. Requires 15 power. Costs 100 iron + 25 gears + 30 steel + 10 circuits + 3 motors.'
             },
             quantumLab: { 
                 cost: 50, 
                 costItems: { iron: 200, gear: 50, steel: 50, circuit: 20, motor: 10, computer: 5 }, // Special cost requiring multiple items
                 icon: '⚛️', 
                 color: '#8A2BE2',
                 inputs: ['left', 'up', 'down', 'right'],
                 outputs: [],
                 productionRate: 0.01,
                 powerConsumption: 20, // Requires power
                 name: 'Quantum Lab',
                 description: 'Advanced research facility. Generates massive research points. Requires research level 8. Requires 20 power. Costs 200 iron + 50 gears + 50 steel + 20 circuits + 10 motors + 5 computers.'
             },
             timeMachine: { 
                 cost: 100, 
                 costItems: { iron: 500, gear: 100, steel: 100, circuit: 50, motor: 25, computer: 15, robot: 5 }, // Special cost requiring multiple items
                 icon: '⏰', 
                 color: '#FF1493',
                 inputs: ['left', 'up', 'down', 'right'],
                 outputs: [],
                 productionRate: 0.001,
                 powerConsumption: 50, // Requires power
                 name: 'Time Machine',
                 description: 'Ultimate building that generates all resources over time. Requires research level 8. Requires 50 power. Costs 500 iron + 100 gears + 100 steel + 50 circuits + 25 motors + 15 computers + 5 robots.'
             },
             // Power generation buildings
             coalGenerator: {
                 cost: 8,
                 icon: '⚡',
                 color: '#2F4F4F',
                 inputs: ['left'],
                 outputs: [],
                 powerProduction: 10, // Generates 10 power per second
                 fuelType: 'coal',
                 fuelConsumption: 0.5, // Consumes 0.5 coal per second
                 name: 'Coal Generator',
                 description: 'Generates 10 power per second. Requires coal fuel input. Unlocked at research level 2.'
             },
             solarPanel: {
                 cost: 12,
                 icon: '☀️',
                 color: '#FFD700',
                 inputs: [],
                 outputs: [],
                 powerProduction: 5, // Generates 5 power per second
                 name: 'Solar Panel',
                 description: 'Generates 5 power per second from sunlight. No fuel required. Unlocked at research level 3.'
             },
             nuclearReactor: {
                 cost: 50,
                 icon: '☢️',
                 color: '#00FF00',
                 inputs: ['left'],
                 outputs: [],
                 powerProduction: 100, // Generates 100 power per second
                 fuelType: 'uranium',
                 fuelConsumption: 0.1, // Consumes 0.1 uranium per second
                 name: 'Nuclear Reactor',
                 description: 'Generates 100 power per second. Requires uranium fuel. Unlocked at research level 6.'
             }
        };
        
        // Game loop for building functionality
        this.lastUpdate = Date.now();
        this.items = new Map(); // For items on conveyors
        this.storage = new Map(); // For storage containers
        this.mousePos = { x: 0, y: 0 };
        this.animationTime = 0;
        this.saveTimer = null; // Timer for debounced saves
        
        // Camera system
        this.camera = { x: 0, y: 0 };
        this.spawnPoint = { x: 0, y: 0 };
        
        // UI elements
        this.tooltip = null;
        this.buildingDetails = null;
        
        // Recipe system
        this.recipes = {
            iron: {
                icon: '⚡',
                name: 'Iron',
                description: 'Basic metal extracted from the ground',
                category: 'raw',
                makes: ['ironRod', 'steel'],
                uses: ['ironMiner'],
                ingredients: []
            },
            copper: {
                icon: '🟤',
                name: 'Copper',
                description: 'Conductive metal extracted from the ground',
                category: 'raw',
                makes: ['copperRod'],
                uses: ['copperMiner'],
                ingredients: []
            },
            ironRod: {
                icon: '🔩',
                name: 'Iron Rod',
                description: 'Processed iron in rod form',
                category: 'processed',
                makes: ['gear'],
                uses: ['roller'],
                ingredients: ['iron']
            },
            copperRod: {
                icon: '🔧',
                name: 'Copper Rod',
                description: 'Processed copper in rod form',
                category: 'processed',
                makes: ['gear'],
                uses: ['roller'],
                ingredients: ['copper']
            },
            steel: {
                icon: '🔥',
                name: 'Steel',
                description: 'Refined iron alloy',
                category: 'processed',
                makes: [],
                uses: ['furnace'],
                ingredients: ['iron']
            },
             gear: {
                 icon: '⚙️',
                 name: 'Gear',
                 description: 'Mechanical component made from rods',
                 category: 'advanced',
                 makes: ['motor'],
                 uses: ['assembler'],
                 ingredients: ['ironRod', 'copperRod']
             },
             circuit: {
                 icon: '🔌',
                 name: 'Circuit',
                 description: 'Electronic component made from gold and steel',
                 category: 'electronic',
                 makes: ['computer'],
                 uses: ['circuitFactory'],
                 ingredients: ['gold', 'steel']
             },
             motor: {
                 icon: '🔧',
                 name: 'Motor',
                 description: 'Mechanical device that converts energy into motion',
                 category: 'mechanical',
                 makes: ['computer', 'robot'],
                 uses: ['motorFactory'],
                 ingredients: ['steel', 'gear']
             },
             computer: {
                 icon: '💻',
                 name: 'Computer',
                 description: 'Advanced computing device',
                 category: 'electronic',
                 makes: ['robot'],
                 uses: ['computerFactory'],
                 ingredients: ['circuit', 'motor']
             },
             robot: {
                 icon: '🤖',
                 name: 'Robot',
                 description: 'Autonomous mechanical being',
                 category: 'ultimate',
                 makes: [],
                 uses: ['robotFactory'],
                 ingredients: ['computer', 'motor']
             },
             coal: {
                 icon: '🪨',
                 name: 'Coal',
                 description: 'Fossil fuel for power generation',
                 category: 'fuel',
                 makes: [],
                 uses: ['coalGenerator'],
                 ingredients: []
             },
             uranium: {
                 icon: '☢️',
                 name: 'Uranium',
                 description: 'Radioactive fuel for nuclear power',
                 category: 'fuel',
                 makes: [],
                 uses: ['nuclearReactor'],
                 ingredients: []
             },
             gold: {
                 icon: '🥇',
                 name: 'Gold',
                 description: 'Precious metal for electronics',
                 category: 'raw',
                 makes: ['circuit'],
                 uses: ['goldMiner'],
                 ingredients: []
             }
        };
        
        this.init();
    }
    
    init() {
        // Load saved game state first
        this.loadGame();
        
        this.setupEventListeners();
        this.setupDebugEventListeners();
        this.resizeCanvas();
        this.draw();
        
        // Initial menu state
        this.updateMenuState();
        this.updateDeleteModeDisplay();
        this.updateBuildingAvailability();
        this.updateResearchGoal();
        
        // Show tutorial if not completed
        if (!this.tutorialCompleted) {
            this.showTutorial();
        }
        
        // Set up auto-save every 30 seconds
        setInterval(() => {
            this.saveGame();
        }, 30000); // Auto-save every 30 seconds
        
        // Start game loop
        this.gameLoop();
    }
    
    createSound(frequency, duration, waveType = 'sine') {
        return () => {
            if (!this.soundEnabled) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = waveType;
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        console.log(`Sound ${this.soundEnabled ? 'enabled' : 'disabled'}`);
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
        
        // Settings button
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.openHelpModal();
        });
        
        document.getElementById('closeHelpModal').addEventListener('click', () => {
            this.closeHelpModal();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        // Settings modal
        document.getElementById('closeSettingsModal').addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        // Debug menu button
        document.getElementById('debugMenuBtn').addEventListener('click', () => {
            this.openDebugModal();
        });
        
        document.getElementById('closeDebugModal').addEventListener('click', () => {
            this.closeDebugModal();
        });
        
        // Reset game button
        document.getElementById('resetGameBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Sound toggle
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
        
        // Tutorial buttons
        document.getElementById('startTutorialBtn').addEventListener('click', () => {
            this.startTutorial();
        });
        
        document.getElementById('skipTutorialBtn').addEventListener('click', () => {
            this.skipTutorial();
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
            
            // Hover descriptions
            item.addEventListener('mouseenter', (e) => {
                this.showBuildingTooltip(e.currentTarget);
            });
            
            item.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
        
        // Return to spawn button
        document.getElementById('returnToSpawn').addEventListener('click', () => {
            this.returnToSpawn();
        });
        
        // Recipe book button
        document.getElementById('recipeBookBtn').addEventListener('click', () => {
            this.openRecipeBook();
        });
        
        // Recipe book modal
        document.getElementById('closeRecipeModal').addEventListener('click', () => {
            this.closeRecipeBook();
        });
        
        // Research button
        document.getElementById('researchBtn').addEventListener('click', () => {
            this.openResearchModal();
        });
        
        // Research modal
        document.getElementById('closeResearchModal').addEventListener('click', () => {
            this.closeResearchModal();
        });
        
        // Recipe category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterRecipes(e.target.dataset.category);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.deleteMode = false;
                this.updateDeleteModeDisplay();
            }
        });
        
        // Canvas right-click for building details
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
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
        
        // Draw holograms if tutorial is active
        if (this.tutorialActive) {
            this.drawHolograms();
        }
        
        // Draw building preview if selected
        if (this.selectedBuilding) {
            this.drawBuildingPreview();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        
        // Calculate visible grid bounds
        const startX = Math.floor(this.camera.x / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.camera.y / this.gridSize) * this.gridSize;
        const endX = this.camera.x + this.canvas.width;
        const endY = this.camera.y + this.canvas.height;
        
        // Draw vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            const screenX = x - this.camera.x;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            const screenY = y - this.camera.y;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
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
            this.buildingMenu.classList.add('open');
            this.menuToggle.querySelector('.arrow').textContent = '◀';
        } else {
            this.buildingMenu.classList.remove('open');
            this.menuToggle.querySelector('.arrow').textContent = '🔨';
        }
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to world coordinates (accounting for camera)
        const worldX = x + this.camera.x;
        const worldY = y + this.camera.y;
        
        // Convert to grid coordinates
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        
        // Check for shift+click (delete mode)
        if (e.shiftKey) {
            this.deleteBuilding(gridX, gridY);
        } else if (this.tutorialActive) {
            this.handleTutorialClick(gridX, gridY);
        } else if (this.selectedBuilding) {
            this.placeBuilding(gridX, gridY, this.selectedBuilding);
        } else {
            console.log(`Clicked at grid position: (${gridX}, ${gridY})`);
        }
    }
    
    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to world coordinates (accounting for camera)
        const worldX = x + this.camera.x;
        const worldY = y + this.camera.y;
        
        // Convert to grid coordinates
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        
        const key = `${gridX},${gridY}`;
        const building = this.buildings.get(key);
        
        if (building) {
            this.showBuildingDetails(building, e.clientX, e.clientY);
        }
    }
    
    selectBuilding(buildingType) {
        if (this.buildingTypes[buildingType] && this.canAfford(buildingType)) {
            this.selectedBuilding = buildingType;
            this.selectedBuildingRotation = 0; // Reset rotation when selecting new building
            this.deleteMode = false;
            this.updateBuildingSelection();
            this.updateDeleteModeDisplay();
            this.draw();
        }
    }
    
    canAfford(buildingType) {
        const building = this.buildingTypes[buildingType];
        
        // Handle special multi-resource costs
        if (building.costItems) {
            for (const [resource, amount] of Object.entries(building.costItems)) {
                if ((this.resources[resource] || 0) < amount) {
                    return false;
                }
            }
            return true;
        }
        
        // Handle legacy single-resource costs
        if (buildingType === 'roller') {
            return this.resources.copper >= building.cost;
        } else if (buildingType === 'goldMiner') {
            return this.resources.iron >= building.cost;
        } else {
            return this.resources.iron >= building.cost;
        }
    }
    
    
    drawBuildings() {
        this.buildings.forEach((building, key) => {
            const pixelPos = this.getPixelPosition(building.x, building.y);
            const screenX = pixelPos.x - this.camera.x;
            const screenY = pixelPos.y - this.camera.y;
            
            // Only draw if building is visible on screen
            if (screenX > -this.gridSize && screenX < this.canvas.width + this.gridSize &&
                screenY > -this.gridSize && screenY < this.canvas.height + this.gridSize) {
                this.drawBuilding(building, screenX, screenY);
            }
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
        
        // Draw production indicator if building is actively producing
        if (building.processing || building.lastProduction) {
            const timeSinceLastProduction = building.lastProduction ? (Date.now() - building.lastProduction) / 1000 : 0;
            if (timeSinceLastProduction < 2) { // Show indicator for 2 seconds after production
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(x + this.gridSize - 8, y + 2, 6, 6);
            }
        }
        
        // Special drawing for conveyor animation
        if (building.type === 'conveyor') {
            this.drawConveyorAnimation(building, x, y);
        } else {
            // Draw building icon with improved rotation
            this.ctx.save();
            this.ctx.translate(x + this.gridSize/2, y + this.gridSize/2);
            
            // Use mirroring for 180-degree rotation instead of upside-down
            if (building.rotation === 2) {
                this.ctx.scale(-1, 1); // Mirror horizontally
            } else {
                this.ctx.rotate(building.rotation * Math.PI / 2);
            }
            
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(buildingType.icon, 0, 0);
            
            this.ctx.restore();
        }
        
        // Draw storage capacity indicator
        if (building.type === 'storage') {
            const key = `${building.x},${building.y}`;
            const storageData = this.storage.get(key);
            if (storageData) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${storageData.items.length}/${buildingType.capacity}`, x + this.gridSize/2, y + this.gridSize - 5);
            }
        }
    }
    
    drawConveyorAnimation(building, x, y) {
        // Draw animated conveyor belt
        this.ctx.save();
        this.ctx.translate(x + this.gridSize/2, y + this.gridSize/2);
        this.ctx.rotate(building.rotation * Math.PI / 2);
        
        // Draw conveyor belt lines
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;
        
        const numLines = 4;
        const lineSpacing = (this.gridSize - 8) / numLines;
        const offset = (this.animationTime * 0.5) % lineSpacing;
        
        for (let i = 0; i < numLines + 1; i++) {
            const lineX = -this.gridSize/2 + 4 + (i * lineSpacing) - offset;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, -this.gridSize/2 + 4);
            this.ctx.lineTo(lineX, this.gridSize/2 - 4);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
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
        
        // Draw building icon with improved rotation
        this.ctx.save();
        this.ctx.translate(x + this.gridSize/2, y + this.gridSize/2);
        
        // Use mirroring for 180-degree rotation instead of upside-down
        if (this.selectedBuildingRotation === 2) {
            this.ctx.scale(-1, 1); // Mirror horizontally
        } else {
            this.ctx.rotate(this.selectedBuildingRotation * Math.PI / 2);
        }
        
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(buildingType.icon, 0, 0);
        
        this.ctx.restore();
    }
    
    drawInputOutputArrows(gridX, gridY, buildingType) {
        const building = this.buildingTypes[buildingType];
        const pixelPos = this.getPixelPosition(gridX, gridY);
        
        // Rotate input/output directions based on building rotation
        const rotatedInputs = this.rotateDirections(building.inputs, this.selectedBuildingRotation);
        const rotatedOutputs = this.rotateDirections(building.outputs, this.selectedBuildingRotation);
        
        // Draw input arrows
        rotatedInputs.forEach(direction => {
            this.drawArrow(pixelPos.x, pixelPos.y, direction, '#4CAF50', true);
        });
        
        // Draw output arrows
        rotatedOutputs.forEach(direction => {
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
                rotation = Math.PI; // Points up
                break;
            case 'down':
                arrowX = centerX;
                arrowY = centerY + this.gridSize/2 + arrowSize;
                rotation = 0; // Points down
                break;
            case 'left':
                arrowX = centerX - this.gridSize/2 - arrowSize;
                arrowY = centerY;
                rotation = -Math.PI/2; // Points left
                break;
            case 'right':
                arrowX = centerX + this.gridSize/2 + arrowSize;
                arrowY = centerY;
                rotation = Math.PI/2; // Points right
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
    
    rotateSelectedBuilding() {
        if (this.selectedBuilding) {
            this.selectedBuildingRotation = (this.selectedBuildingRotation + 1) % 4;
            this.draw();
        }
    }
    
    rotateDirections(directions, rotation) {
        const directionMap = {
            'up': 0,
            'right': 1,
            'down': 2,
            'left': 3
        };
        
        const reverseMap = {
            0: 'up',
            1: 'right',
            2: 'down',
            3: 'left'
        };
        
        return directions.map(direction => {
            const currentDirection = directionMap[direction];
            const newDirection = (currentDirection + rotation) % 4;
            return reverseMap[newDirection];
        });
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
        document.getElementById('copperCount').textContent = this.resources.copper;
        document.getElementById('ironRodCount').textContent = this.resources.ironRod;
        document.getElementById('copperRodCount').textContent = this.resources.copperRod;
        document.getElementById('steelCount').textContent = this.resources.steel;
        document.getElementById('gearCount').textContent = this.resources.gear;
        document.getElementById('circuitCount').textContent = this.resources.circuit;
        document.getElementById('motorCount').textContent = this.resources.motor;
        document.getElementById('computerCount').textContent = this.resources.computer;
        document.getElementById('robotCount').textContent = this.resources.robot;
        document.getElementById('coalCount').textContent = this.resources.coal;
        document.getElementById('uraniumCount').textContent = this.resources.uranium;
        document.getElementById('goldCount').textContent = this.resources.gold;
        
        // Power display will be updated after buildings are processed
        
        this.updateBuildingAvailability();
        this.updateResearchGoal(); // Update progress bar when resources change
        
        // Update research modal if it's open
        const researchModal = document.getElementById('researchModal');
        if (researchModal && researchModal.style.display === 'flex') {
            this.populateResearchModal();
        }
        
        // Update recipe book if it's open
        const recipeBookModal = document.getElementById('recipeBookModal');
        if (recipeBookModal && recipeBookModal.style.display === 'flex') {
            this.populateRecipeBook();
        }
        
        // Update debug display if it's open
        const debugModal = document.getElementById('debugModal');
        if (debugModal && debugModal.style.display === 'flex') {
            this.updateDebugDisplay();
        }
    }
    
    updateBuildingAvailability() {
        document.querySelectorAll('.building-item').forEach(item => {
            const buildingType = item.dataset.building;
            const canAfford = this.canAfford(buildingType);
            const isUnlocked = this.isBuildingUnlocked(buildingType);
            const building = this.buildingTypes[buildingType];
            
            if (isUnlocked) {
                // Show actual building info
                item.querySelector('.building-icon').textContent = building.icon;
                item.querySelector('.building-name').textContent = building.name;
                // Display cost properly for both single and multi-resource buildings
                if (building.costItems) {
                    const costParts = [];
                    for (const [resource, amount] of Object.entries(building.costItems)) {
                        costParts.push(`${amount} ${resource}`);
                    }
                    item.querySelector('.building-cost').textContent = `Cost: ${costParts.join(' + ')}`;
                } else {
                    item.querySelector('.building-cost').textContent = `Cost: ${building.cost} ${buildingType === 'roller' ? 'Copper' : 'Iron'}`;
                }
                
                if (canAfford) {
                    item.classList.remove('disabled');
                } else {
                    item.classList.add('disabled');
                }
            } else {
                // Show question marks for undiscovered buildings
                item.querySelector('.building-icon').textContent = '❓';
                item.querySelector('.building-name').textContent = '❓';
                item.querySelector('.building-cost').textContent = '❓';
                item.classList.add('disabled');
            }
        });
    }
    
    isBuildingUnlocked(buildingType) {
        // Check if building is unlocked by research level
        const building = this.buildingTypes[buildingType];
        if (!building) return false;
        
        // Basic buildings are always unlocked
        const basicBuildings = ['ironMiner', 'conveyor', 'submitter'];
        if (basicBuildings.includes(buildingType)) return true;
        
        // Check research requirements for advanced buildings
        for (let level = 1; level <= 8; level++) {
            const requirements = this.researchRequirements[level];
            if (requirements && requirements.unlocks.includes(buildingType)) {
                return this.researchLevel >= level;
            }
        }
        
        return false;
    }
    
    handleKeyPress(e) {
        if (e.key === 'Escape') {
            this.selectedBuilding = null;
            this.selectedBuildingRotation = 0;
            this.deleteMode = false;
            this.updateBuildingSelection();
            this.updateDeleteModeDisplay();
            this.canvas.style.cursor = 'crosshair';
            this.draw();
        } else if (e.key === 'Shift') {
            this.deleteMode = true;
            this.updateDeleteModeDisplay();
        } else if (e.key === 'r' || e.key === 'R') {
            this.rotateSelectedBuilding();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            this.camera.x -= this.gridSize * 2;
            this.draw();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            this.camera.x += this.gridSize * 2;
            this.draw();
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            this.camera.y -= this.gridSize * 2;
            this.draw();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            this.camera.y += this.gridSize * 2;
            this.draw();
        } else if (e.key === 'Home') {
            // Return to spawn/home
            this.returnToSpawn();
        } else if (e.key === 'b' || e.key === 'B') {
            // Toggle build menu
            this.toggleBuildMenu();
        } else if (e.key === 't' || e.key === 'T') {
            // Open research modal
            this.openResearchModal();
        } else if (e.key === 'p' || e.key === 'P') {
            // Open recipe book
            this.openRecipeBook();
        } else if (e.key === '1') {
            this.selectBuilding('ironMiner');
        } else if (e.key === '2') {
            this.selectBuilding('conveyor');
        } else if (e.key === '3') {
            this.selectBuilding('submitter');
        } else if (e.key === '4') {
            this.selectBuilding('copperMiner');
        } else if (e.key === '5') {
            this.selectBuilding('roller');
        } else if (e.key === '6') {
            this.selectBuilding('storage');
        } else if (e.key === '7') {
            this.selectBuilding('furnace');
        } else if (e.key === '8') {
            this.selectBuilding('assembler');
        } else if (e.key === 'm' || e.key === 'M') {
            // Toggle sound
            this.toggleSound();
            document.getElementById('soundToggle').checked = this.soundEnabled;
        } else if (e.key === 'h' || e.key === 'H') {
            this.openHelpModal();
        }
    }
    
    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        this.selectedBuilding = null;
        this.updateBuildingSelection();
        this.updateDeleteModeDisplay();
        this.canvas.style.cursor = this.deleteMode ? 'not-allowed' : 'crosshair';
        this.draw();
    }
    
    deleteBuilding(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        const building = this.buildings.get(key);
        
        if (building) {
            // Refund half the cost
            const buildingType = this.buildingTypes[building.type];
            if (buildingType.costItems) {
                // Handle multi-resource refunds
                for (const [resource, amount] of Object.entries(buildingType.costItems)) {
                    const refund = Math.floor(amount / 2);
                    this.resources[resource] += refund;
                }
            } else {
                // Handle legacy single-resource refunds
                const refund = Math.floor(buildingType.cost / 2);
                if (building.type === 'roller') {
                    this.resources.copper += refund;
                } else {
                    this.resources.iron += refund;
                }
            }
            
            // Remove building
            this.buildings.delete(key);
            
            // Play sound and update UI
            this.playSound('delete');
            this.updateResourceDisplay();
            this.updateBuildingAvailability();
            this.draw();
            
            // Save game state
            this.saveGame();
        }
    }
    
    updateDeleteModeDisplay() {
        if (this.deleteMode) {
            this.deleteOverlay.classList.add('active');
            this.canvas.style.cursor = 'not-allowed';
        } else {
            this.deleteOverlay.classList.remove('active');
            this.canvas.style.cursor = 'crosshair';
        }
    }
    
    updateResearchGoal() {
        const nextLevel = this.researchLevel + 1;
        const requirements = this.researchRequirements[nextLevel];
        const goalElement = document.getElementById('researchGoal');
        
        if (requirements) {
            const requirementText = Object.entries(requirements.items)
                .map(([itemType, amount]) => `${amount} ${this.recipes[itemType]?.name || itemType}`)
                .join(', ');
            goalElement.querySelector('.goal-text').textContent = 
                `Research Level ${nextLevel}: Collect ${requirementText}`;
            
            // Calculate progress
            let totalRequired = 0;
            let totalMet = 0;
            
            for (const [itemType, requiredAmount] of Object.entries(requirements.items)) {
                totalRequired += requiredAmount;
                totalMet += Math.min(this.resources[itemType] || 0, requiredAmount);
            }
            
            const progressPercent = totalRequired > 0 ? (totalMet / totalRequired) * 100 : 0;
            
            // Update progress bar
            document.getElementById('goalProgressFill').style.width = `${progressPercent}%`;
            document.getElementById('goalProgressText').textContent = `${Math.round(progressPercent)}%`;
        } else {
            goalElement.querySelector('.goal-text').textContent = 'All research levels completed!';
            document.getElementById('goalProgressFill').style.width = '100%';
            document.getElementById('goalProgressText').textContent = '100%';
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
        this.animationTime += deltaTime;
        
        this.updateBuildings(deltaTime);
        this.updateItems(deltaTime);
        this.updateStorage(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateBuildings(deltaTime) {
        // Reset power grid calculations
        this.powerGrid.totalProduction = 0;
        this.powerGrid.totalConsumption = 0;
        
        this.buildings.forEach((building, key) => {
            this.updateBuilding(building, deltaTime);
        });
        
        // Update power efficiency based on production vs consumption
        if (this.powerGrid.totalConsumption > 0) {
            this.powerGrid.efficiency = Math.min(1.0, this.powerGrid.totalProduction / this.powerGrid.totalConsumption);
        } else {
            this.powerGrid.efficiency = 1.0;
        }
        
        // Update power resource
        this.resources.power = Math.max(0, this.powerGrid.totalProduction - this.powerGrid.totalConsumption);
        
        // Update power display
        document.getElementById('powerDisplay').textContent = 
            `${this.powerGrid.totalProduction}/${this.powerGrid.totalConsumption}`;
    }
    
    updateBuilding(building, deltaTime) {
        const buildingType = this.buildingTypes[building.type];
        
        switch (building.type) {
            case 'ironMiner':
            case 'copperMiner':
            case 'goldMiner':
            case 'advancedMiner':
                this.updateMiner(building, buildingType, deltaTime);
                break;
            case 'conveyor':
                this.updateConveyor(building, buildingType, deltaTime);
                break;
            case 'roller':
                this.updateRoller(building, buildingType, deltaTime);
                break;
            case 'furnace':
                this.updateFurnace(building, buildingType, deltaTime);
                break;
            case 'assembler':
                this.updateAssembler(building, buildingType, deltaTime);
                break;
            case 'splitter':
                this.updateSplitter(building, buildingType, deltaTime);
                break;
            case 'factory':
                this.updateFactory(building, buildingType, deltaTime);
                break;
            case 'lab':
                this.updateLab(building, buildingType, deltaTime);
                break;
            case 'storage':
                this.updateStorageBuilding(building, buildingType, deltaTime);
                break;
             case 'submitter':
                 this.updateSubmitter(building, buildingType, deltaTime);
                 break;
             case 'circuitFactory':
                 this.updateCircuitFactory(building, buildingType, deltaTime);
                 break;
             case 'motorFactory':
                 this.updateMotorFactory(building, buildingType, deltaTime);
                 break;
             case 'computerFactory':
                 this.updateComputerFactory(building, buildingType, deltaTime);
                 break;
             case 'robotFactory':
                 this.updateRobotFactory(building, buildingType, deltaTime);
                 break;
             case 'quantumLab':
                 this.updateQuantumLab(building, buildingType, deltaTime);
                 break;
             case 'timeMachine':
                 this.updateTimeMachine(building, buildingType, deltaTime);
                 break;
             case 'coalGenerator':
             case 'solarPanel':
             case 'nuclearReactor':
                 this.updatePowerGenerator(building, buildingType, deltaTime);
                 break;
        }
    }
    
    updateMiner(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Produce iron over time
        if (!building.lastProduction) {
            building.lastProduction = Date.now();
        }
        
        // Apply power efficiency to production rate
        const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
        const timeSinceLastProduction = (Date.now() - building.lastProduction) / 1000;
        if (timeSinceLastProduction >= 1 / effectiveProductionRate) {
            // Get rotated output direction
            const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
            const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
            if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`)) {
                // Create item and discover it
                const itemType = buildingType.productionType;
                this.items.set(`${outputPos.x},${outputPos.y}`, {
                    type: itemType,
                    x: outputPos.x,
                    y: outputPos.y,
                    progress: 0
                });
                
                // Discover the item if it's not already discovered
                this.discoverItem(itemType);
                
                building.lastProduction = Date.now();
            }
        }
    }
    
    updateConveyor(building, buildingType, deltaTime) {
        // Move items along conveyor
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item) {
            // Get rotated output direction
            const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
            const nextPos = this.getOutputPosition(building, rotatedOutputs[0]);
            
            // Check if next position is available (not blocked)
            const canMove = !nextPos || !this.items.has(`${nextPos.x},${nextPos.y}`) && 
                           !this.isStorageFull(nextPos.x, nextPos.y);
            
            if (canMove) {
                item.progress += buildingType.speed * deltaTime;
                
                if (item.progress >= 1) {
                    if (nextPos) {
                        // Move to next position
                        this.items.delete(key);
                        this.items.set(`${nextPos.x},${nextPos.y}`, {
                            ...item,
                            x: nextPos.x,
                            y: nextPos.y,
                            progress: 0
                        });
                    } else {
                        // No output, item falls off (but we prevent this now)
                        this.items.delete(key);
                    }
                }
            }
            // If can't move, item stays in place (conveyor stops)
        }
    }
    
    updateRoller(building, buildingType, deltaTime) {
        // Process items in roller
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
            building.processingItem = item.type;
        }
        
        if (building.processing) {
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / buildingType.productionRate) {
                // Convert item to rod
                let outputType;
                if (building.processingItem === 'iron') {
                    outputType = 'ironRod';
                } else if (building.processingItem === 'copper') {
                    outputType = 'copperRod';
                }
                
                if (outputType) {
                    // Get rotated output direction
                    const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                    const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                    
                    if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                        !this.isStorageFull(outputPos.x, outputPos.y)) {
                        // Create rod item
                        this.items.set(`${outputPos.x},${outputPos.y}`, {
                            type: outputType,
                            x: outputPos.x,
                            y: outputPos.y,
                            progress: 0
                        });
                        
                        // Remove input item
                        this.items.delete(key);
                    }
                }
                
                building.processing = false;
                building.processingTime = 0;
                building.processingItem = null;
            }
        }
    }
    
    updateStorageBuilding(building, buildingType, deltaTime) {
        const key = `${building.x},${building.y}`;
        
        // Initialize storage if not exists
        if (!this.storage.has(key)) {
            this.storage.set(key, { items: [] });
        }
        
        const storageData = this.storage.get(key);
        
        // Check for items to store
        const item = this.items.get(key);
        if (item && storageData.items.length < buildingType.capacity) {
            storageData.items.push(item.type);
            this.items.delete(key);
        }
        
        // Try to output items
        if (storageData.items.length > 0) {
            const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
            for (const direction of rotatedOutputs) {
                const outputPos = this.getOutputPosition(building, direction);
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Output item
                    const itemType = storageData.items.shift();
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: itemType,
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    break;
                }
            }
        }
    }
    
    updateStorage(deltaTime) {
        // Storage updates are handled in updateStorageBuilding
    }
    
    isStorageFull(x, y) {
        const key = `${x},${y}`;
        const building = this.buildings.get(key);
        if (building && building.type === 'storage') {
            const storageData = this.storage.get(key);
            const buildingType = this.buildingTypes[building.type];
            return storageData && storageData.items.length >= buildingType.capacity;
        }
        return false;
    }
    
    updateFurnace(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Process iron into steel
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item && item.type === 'iron' && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
        }
        
        if (building.processing) {
            // Apply power efficiency to processing speed
            const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / effectiveProductionRate) {
                // Get rotated output direction
                const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create steel item
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: 'steel',
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    
                    // Remove input item
                    this.items.delete(key);
                    
                    // Discover steel
                    this.discoverItem('steel');
                }
                
                building.processing = false;
                building.processingTime = 0;
            }
        }
    }
    
    updateAssembler(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Process iron rods and copper rods into gears
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        // Check if we have both required items
        const hasIronRod = item && item.type === 'ironRod';
        const hasCopperRod = this.checkInputItems(building, 'copperRod');
        
        if (hasIronRod && hasCopperRod && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
        }
        
        if (building.processing) {
            // Apply power efficiency to processing speed
            const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / effectiveProductionRate) {
                // Get rotated output direction
                const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create gear item
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: 'gear',
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    
                    // Remove input items
                    this.items.delete(key);
                    this.removeInputItem(building, 'copperRod');
                    
                    // Discover gear
                    this.discoverItem('gear');
                }
                
                building.processing = false;
                building.processingTime = 0;
            }
        }
    }
    
    checkInputItems(building, itemType) {
        // Check if building has the required input item
        const rotatedInputs = this.rotateDirections(this.buildingTypes[building.type].inputs, building.rotation);
        for (const direction of rotatedInputs) {
            const inputPos = this.getInputPosition(building, direction);
            if (inputPos) {
                const inputKey = `${inputPos.x},${inputPos.y}`;
                const inputItem = this.items.get(inputKey);
                if (inputItem && inputItem.type === itemType) {
                    return true;
                }
            }
        }
        return false;
    }
    
    removeInputItem(building, itemType) {
        // Remove the first matching input item
        const rotatedInputs = this.rotateDirections(this.buildingTypes[building.type].inputs, building.rotation);
        for (const direction of rotatedInputs) {
            const inputPos = this.getInputPosition(building, direction);
            if (inputPos) {
                const inputKey = `${inputPos.x},${inputPos.y}`;
                const inputItem = this.items.get(inputKey);
                if (inputItem && inputItem.type === itemType) {
                    this.items.delete(inputKey);
                    return;
                }
            }
        }
    }
    
    getInputPosition(building, direction) {
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
    
    discoverItem(itemType) {
        if (!this.discoveredItems.has(itemType)) {
            this.discoveredItems.add(itemType);
            console.log(`Discovered: ${this.recipes[itemType].name}!`);
            
            // Update recipe book if it's open
            const recipeBookModal = document.getElementById('recipeBookModal');
            if (recipeBookModal && recipeBookModal.style.display === 'flex') {
                this.populateRecipeBook();
            }
            
            // Save game state
            this.saveGame();
        }
    }
    
    updateSplitter(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Split items to multiple outputs
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item) {
            const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
            let outputCount = 0;
            
            // Try to output to each direction
            for (const direction of rotatedOutputs) {
                const outputPos = this.getOutputPosition(building, direction);
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create item at output
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: item.type,
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    outputCount++;
                }
            }
            
            // Remove input item if at least one output was successful
            if (outputCount > 0) {
                this.items.delete(key);
            }
        }
    }
    
    updateFactory(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Advanced factory processing
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
            building.processingItem = item.type;
        }
        
        if (building.processing) {
            // Apply power efficiency to processing speed
            const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / effectiveProductionRate) {
                // Get rotated output direction
                const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create advanced item (gear for now)
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: 'gear',
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    
                    // Remove input item
                    this.items.delete(key);
                }
                
                building.processing = false;
                building.processingTime = 0;
                building.processingItem = null;
            }
        }
    }
    
    updateLab(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Generate research points
        if (!building.lastResearch) {
            building.lastResearch = Date.now();
        }
        
        // Apply power efficiency to production rate
        const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
        const timeSinceLastResearch = (Date.now() - building.lastResearch) / 1000;
        if (timeSinceLastResearch >= 1 / effectiveProductionRate) {
            this.researchProgress += 1;
            building.lastResearch = Date.now();
            
            // Check if we can advance research level
            this.checkResearchAdvancement();
        }
    }
    
    checkResearchAdvancement() {
        const nextLevel = this.researchLevel + 1;
        const requirements = this.researchRequirements[nextLevel];
        
        if (requirements) {
            let canAdvance = true;
            for (const [itemType, requiredAmount] of Object.entries(requirements.items)) {
                if (this.resources[itemType] < requiredAmount) {
                    canAdvance = false;
                    break;
                }
            }
            
            if (canAdvance) {
                this.advanceResearchLevel();
            }
        }
    }
    
    advanceResearchLevel() {
        // Prevent spam clicking (1 second cooldown)
        const now = Date.now();
        if (now - this.lastResearchClick < 1000) {
            console.log('Please wait before clicking research again!');
            // Visual feedback for cooldown
            const nextLevel = this.researchLevel + 1;
            const button = document.getElementById(`researchBtn${nextLevel}`);
            if (button) {
                button.style.opacity = '0.5';
                button.textContent = 'Please wait...';
                setTimeout(() => {
                    button.style.opacity = '1';
                    button.textContent = `Research Level ${nextLevel}`;
                }, 1000);
            }
            return;
        }
        this.lastResearchClick = now;
        
        const nextLevel = this.researchLevel + 1;
        const requirements = this.researchRequirements[nextLevel];
        
        // Check if requirements exist
        if (!requirements) {
            console.log('No more research levels available!');
            return;
        }
        
        // Validate that we have enough resources
        for (const [itemType, requiredAmount] of Object.entries(requirements.items)) {
            if ((this.resources[itemType] || 0) < requiredAmount) {
                console.log(`Not enough ${itemType} to advance research level ${nextLevel}`);
                return;
            }
        }
        
        // Consume required items
        for (const [itemType, requiredAmount] of Object.entries(requirements.items)) {
            this.resources[itemType] -= requiredAmount;
        }
        
        // Advance level
        this.researchLevel = nextLevel;
        this.researchProgress = 0;
        
        // Play sound and update UI
        this.playSound('research');
        this.updateResourceDisplay();
        this.updateBuildingAvailability();
        this.updateResearchGoal();
        
        // Refresh research modal if it's open
        if (document.getElementById('researchModal').style.display === 'flex') {
            this.populateResearchModal();
        }
        
        console.log(`Research Level ${nextLevel} unlocked!`);
        
        // Save game state
        this.saveGame();
    }
    
    updateSubmitter(building, buildingType, deltaTime) {
        // Collect items from inputs
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        if (item) {
            // Add to resources
            this.resources[item.type] = (this.resources[item.type] || 0) + 1;
            this.items.delete(key);
            this.playSound('collect');
            this.updateResourceDisplay();
            
            // Save game state will be handled by auto-save (every 30 seconds)
            // Immediate saves are done for major actions (place/delete buildings, research, etc.)
        }
    }
    
    updateCircuitFactory(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Process copper and steel into circuits
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        // Check if we have both required items
        const hasGold = item && item.type === 'gold';
        const hasSteel = this.checkInputItems(building, 'steel');
        
        if (hasGold && hasSteel && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
        }
        
        if (building.processing) {
            // Apply power efficiency to processing speed
            const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / effectiveProductionRate) {
                // Get rotated output direction
                const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create circuit item
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: 'circuit',
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    
                    // Remove input items
                    this.items.delete(key);
                    this.removeInputItem(building, 'steel');
                    
                    // Discover circuit
                    this.discoverItem('circuit');
                }
                
                building.processing = false;
                building.processingTime = 0;
            }
        }
    }
    
    updateMotorFactory(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Process steel and gears into motors
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        // Check if we have both required items
        const hasSteel = item && item.type === 'steel';
        const hasGear = this.checkInputItems(building, 'gear');
        
        if (hasSteel && hasGear && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
        }
        
        if (building.processing) {
            // Apply power efficiency to processing speed
            const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / effectiveProductionRate) {
                // Get rotated output direction
                const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create motor item
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: 'motor',
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    
                    // Remove input items
                    this.items.delete(key);
                    this.removeInputItem(building, 'gear');
                    
                    // Discover motor
                    this.discoverItem('motor');
                }
                
                building.processing = false;
                building.processingTime = 0;
            }
        }
    }
    
    updateComputerFactory(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Process circuits and motors into computers
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        // Check if we have both required items
        const hasCircuit = item && item.type === 'circuit';
        const hasMotor = this.checkInputItems(building, 'motor');
        
        if (hasCircuit && hasMotor && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
        }
        
        if (building.processing) {
            // Apply power efficiency to processing speed
            const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / effectiveProductionRate) {
                // Get rotated output direction
                const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create computer item
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: 'computer',
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    
                    // Remove input items
                    this.items.delete(key);
                    this.removeInputItem(building, 'motor');
                    
                    // Discover computer
                    this.discoverItem('computer');
                }
                
                building.processing = false;
                building.processingTime = 0;
            }
        }
    }
    
    updateRobotFactory(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Process computers and motors into robots
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        // Check if we have both required items
        const hasComputer = item && item.type === 'computer';
        const hasMotor = this.checkInputItems(building, 'motor');
        
        if (hasComputer && hasMotor && !building.processing) {
            building.processing = true;
            building.processingTime = 0;
        }
        
        if (building.processing) {
            // Apply power efficiency to processing speed
            const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
            building.processingTime += deltaTime;
            
            if (building.processingTime >= 1 / effectiveProductionRate) {
                // Get rotated output direction
                const rotatedOutputs = this.rotateDirections(buildingType.outputs, building.rotation);
                const outputPos = this.getOutputPosition(building, rotatedOutputs[0]);
                
                if (outputPos && !this.items.has(`${outputPos.x},${outputPos.y}`) && 
                    !this.isStorageFull(outputPos.x, outputPos.y)) {
                    // Create robot item
                    this.items.set(`${outputPos.x},${outputPos.y}`, {
                        type: 'robot',
                        x: outputPos.x,
                        y: outputPos.y,
                        progress: 0
                    });
                    
                    // Remove input items
                    this.items.delete(key);
                    this.removeInputItem(building, 'motor');
                    
                    // Discover robot
                    this.discoverItem('robot');
                }
                
                building.processing = false;
                building.processingTime = 0;
            }
        }
    }
    
    updateQuantumLab(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Generate massive research points
        if (!building.lastResearch) {
            building.lastResearch = Date.now();
        }
        
        // Apply power efficiency to production rate
        const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
        const timeSinceLastResearch = (Date.now() - building.lastResearch) / 1000;
        if (timeSinceLastResearch >= 1 / effectiveProductionRate) {
            this.researchProgress += 10; // Much faster research
            building.lastResearch = Date.now();
            
            // Check if we can advance research level
            this.checkResearchAdvancement();
        }
    }
    
    updateTimeMachine(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Generate all resources over time
        if (!building.lastProduction) {
            building.lastProduction = Date.now();
        }
        
        // Apply power efficiency to production rate
        const effectiveProductionRate = buildingType.productionRate * this.powerGrid.efficiency;
        const timeSinceLastProduction = (Date.now() - building.lastProduction) / 1000;
        if (timeSinceLastProduction >= 1 / effectiveProductionRate) {
            // Generate small amounts of all resources
            this.resources.iron += 1;
            this.resources.copper += 1;
            this.resources.ironRod += 1;
            this.resources.copperRod += 1;
            this.resources.steel += 1;
            this.resources.gear += 1;
            this.resources.circuit += 1;
            this.resources.motor += 1;
            this.resources.computer += 1;
            this.resources.robot += 1;
            
            building.lastProduction = Date.now();
            this.updateResourceDisplay();
        }
    }
    
    updatePowerGenerator(building, buildingType, deltaTime) {
        // Add power consumption to grid
        if (buildingType.powerConsumption) {
            this.powerGrid.totalConsumption += buildingType.powerConsumption;
        }
        
        // Generate power if it's a power generator
        if (buildingType.powerProduction) {
            let canGenerate = true;
            
            // Check fuel requirements
            if (buildingType.fuelType && buildingType.fuelConsumption) {
                const fuelAmount = this.resources[buildingType.fuelType] || 0;
                if (fuelAmount < buildingType.fuelConsumption * deltaTime) {
                    canGenerate = false;
                } else {
                    // Consume fuel
                    this.resources[buildingType.fuelType] -= buildingType.fuelConsumption * deltaTime;
                }
            }
            
            if (canGenerate) {
                this.powerGrid.totalProduction += buildingType.powerProduction;
                building.lastProduction = Date.now();
            }
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
            const screenX = pixelPos.x - this.camera.x;
            const screenY = pixelPos.y - this.camera.y;
            
            // Only draw if item is visible on screen
            if (screenX > -this.gridSize && screenX < this.canvas.width + this.gridSize &&
                screenY > -this.gridSize && screenY < this.canvas.height + this.gridSize) {
                this.drawItem(item, screenX, screenY);
            }
        });
    }
    
    drawItem(item, x, y) {
        // Draw item as a small circle with different colors
        let color = '#C0C0C0'; // Default silver
        switch (item.type) {
            case 'iron':
                color = '#C0C0C0'; // Silver
                break;
            case 'copper':
                color = '#B87333'; // Copper
                break;
            case 'ironRod':
                color = '#A0A0A0'; // Dark silver
                break;
            case 'copperRod':
                color = '#CD7F32'; // Bronze
                break;
            case 'steel':
                color = '#708090'; // Steel gray
                break;
             case 'gear':
                 color = '#2F4F4F'; // Dark slate gray
                 break;
             case 'circuit':
                 color = '#FF69B4'; // Hot pink
                 break;
             case 'motor':
                 color = '#FFD700'; // Gold
                 break;
             case 'computer':
                 color = '#00BFFF'; // Deep sky blue
                 break;
             case 'robot':
                 color = '#FF4500'; // Orange red
                 break;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw item border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    // Camera controls
    returnToSpawn() {
        this.camera.x = this.spawnPoint.x;
        this.camera.y = this.spawnPoint.y;
        this.draw();
    }
    
    toggleBuildMenu() {
        const menu = document.getElementById('buildMenu');
        const isCollapsed = menu.classList.contains('collapsed');
        if (isCollapsed) {
            menu.classList.remove('collapsed');
        } else {
            menu.classList.add('collapsed');
        }
    }
    
    openResearchModal() {
        this.populateResearchModal();
        document.getElementById('researchModal').style.display = 'flex';
    }
    
    openRecipeBook() {
        this.populateRecipeBook();
        document.getElementById('recipeBookModal').style.display = 'flex';
    }
    
    selectBuilding(buildingType) {
        if (this.isBuildingUnlocked(buildingType) && this.canAfford(buildingType)) {
            this.selectedBuilding = buildingType;
            this.selectedBuildingRotation = 0;
            this.deleteMode = false;
            this.updateBuildingSelection();
            this.updateDeleteModeDisplay();
            this.canvas.style.cursor = 'crosshair';
            this.draw();
        }
    }
    
    // Tooltip system
    showBuildingTooltip(element) {
        const buildingType = element.dataset.building;
        const building = this.buildingTypes[buildingType];
        
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'building-tooltip';
            document.body.appendChild(this.tooltip);
        }
        
        this.tooltip.innerHTML = `
            <strong>${building.name}</strong><br>
            ${building.description}<br>
            <em>Cost: ${building.cost} Iron</em>
        `;
        
        this.tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    // Building details system
    showBuildingDetails(building, x, y) {
        // Remove existing details
        if (this.buildingDetails) {
            this.buildingDetails.remove();
        }
        
        const buildingType = this.buildingTypes[building.type];
        const key = `${building.x},${building.y}`;
        const item = this.items.get(key);
        
        // Determine building status
        let status = 'stopped';
        let statusText = 'Not working';
        let requirements = [];
        
        switch (building.type) {
            case 'miner':
                if (!item) {
                    status = 'working';
                    statusText = 'Producing iron';
                } else {
                    status = 'stopped';
                    statusText = 'Output blocked';
                    requirements = ['Clear output path'];
                }
                break;
            case 'conveyor':
                if (item) {
                    status = 'working';
                    statusText = 'Transporting items';
                } else {
                    status = 'stopped';
                    statusText = 'No items to transport';
                    requirements = ['Connect to item source'];
                }
                break;
            case 'submitter':
                if (item) {
                    status = 'working';
                    statusText = 'Collecting items';
                } else {
                    status = 'stopped';
                    statusText = 'No items to collect';
                    requirements = ['Connect conveyor belts'];
                }
                break;
        }
        
        this.buildingDetails = document.createElement('div');
        this.buildingDetails.className = 'building-details';
        this.buildingDetails.innerHTML = `
            <button class="close-btn">&times;</button>
            <h3>${buildingType.name}</h3>
            <div class="status ${status}">
                <strong>Status:</strong> ${statusText}
            </div>
            <div><strong>Position:</strong> (${building.x}, ${building.y})</div>
            <div><strong>Type:</strong> ${building.type}</div>
            ${requirements.length > 0 ? `
                <div><strong>Requirements:</strong></div>
                <ul>
                    ${requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            ` : ''}
        `;
        
        // Position the details panel
        this.buildingDetails.style.left = Math.min(x, window.innerWidth - 320) + 'px';
        this.buildingDetails.style.top = Math.min(y, window.innerHeight - 200) + 'px';
        
        document.body.appendChild(this.buildingDetails);
        
        // Close button functionality
        this.buildingDetails.querySelector('.close-btn').addEventListener('click', () => {
            this.buildingDetails.remove();
            this.buildingDetails = null;
        });
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', this.closeBuildingDetails.bind(this));
        }, 100);
    }
    
    closeBuildingDetails(e) {
        if (this.buildingDetails && !this.buildingDetails.contains(e.target)) {
            this.buildingDetails.remove();
            this.buildingDetails = null;
            document.removeEventListener('click', this.closeBuildingDetails);
        }
    }
    
    // Recipe book system
    openRecipeBook() {
        const modal = document.getElementById('recipeModal');
        modal.style.display = 'flex';
        this.populateMaterialsList('all');
        this.hideRecipeDetails();
    }
    
    closeRecipeBook() {
        const modal = document.getElementById('recipeModal');
        modal.style.display = 'none';
    }
    
    filterRecipes(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.populateMaterialsList(category);
    }
    
    populateMaterialsList(category) {
        const materialsList = document.getElementById('materialsList');
        materialsList.innerHTML = '';
        
        Object.entries(this.recipes).forEach(([itemType, recipe]) => {
            if (category !== 'all' && recipe.category !== category) {
                return;
            }
            
            const isDiscovered = this.discoveredItems.has(itemType);
            const materialItem = document.createElement('div');
            materialItem.className = `material-item ${isDiscovered ? 'discovered' : 'undiscovered'}`;
            materialItem.dataset.material = itemType;
            
            materialItem.innerHTML = `
                <span class="material-icon">${isDiscovered ? recipe.icon : '❓'}</span>
                <span class="material-name">${isDiscovered ? recipe.name : '❓'}</span>
            `;
            
            // Add click event
            materialItem.addEventListener('click', () => {
                this.showRecipeDetails(itemType);
            });
            
            materialsList.appendChild(materialItem);
        });
    }
    
    showRecipeDetails(itemType) {
        const recipe = this.recipes[itemType];
        const isDiscovered = this.discoveredItems.has(itemType);
        
        document.getElementById('selectedMaterialName').innerHTML = `
            <span class="material-icon">${isDiscovered ? recipe.icon : '❓'}</span>
            ${isDiscovered ? recipe.name : '❓'}
        `;
        
        let detailsHTML = '';
        
        if (isDiscovered) {
            detailsHTML += `<div class="recipe-description">${recipe.description}</div>`;
            
            if (recipe.ingredients.length > 0) {
                detailsHTML += `
                    <div class="recipe-section">
                        <h4>Made from:</h4>
                        <div class="recipe-ingredients">
                            ${recipe.ingredients.map(ing => {
                                const ingRecipe = this.recipes[ing];
                                const ingDiscovered = this.discoveredItems.has(ing);
                                return `<span class="ingredient">
                                    <span class="ingredient-icon">${ingDiscovered ? ingRecipe.icon : '❓'}</span>
                                    ${ingDiscovered ? ingRecipe.name : '❓'}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (recipe.makes.length > 0) {
                detailsHTML += `
                    <div class="recipe-section">
                        <h4>Used to make:</h4>
                        <div class="recipe-ingredients">
                            ${recipe.makes.map(make => {
                                const makeRecipe = this.recipes[make];
                                const makeDiscovered = this.discoveredItems.has(make);
                                return `<span class="ingredient">
                                    <span class="ingredient-icon">${makeDiscovered ? makeRecipe.icon : '❓'}</span>
                                    ${makeDiscovered ? makeRecipe.name : '❓'}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (recipe.uses.length > 0) {
                detailsHTML += `
                    <div class="recipe-section">
                        <h4>Made by:</h4>
                        <div class="recipe-ingredients">
                            ${recipe.uses.map(use => {
                                const building = this.buildingTypes[use];
                                const buildingUnlocked = this.isBuildingUnlocked(use);
                                return `<span class="ingredient">
                                    <span class="ingredient-icon">${buildingUnlocked ? building.icon : '❓'}</span>
                                    ${buildingUnlocked ? building.name : '❓'}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        } else {
            detailsHTML = '<div class="recipe-description">This item has not been discovered yet. Keep researching to unlock it!</div>';
        }
        
        document.getElementById('selectedMaterialInfo').innerHTML = detailsHTML;
        document.getElementById('recipeDetails').style.display = 'block';
    }
    
    hideRecipeDetails() {
        document.getElementById('recipeDetails').style.display = 'none';
    }
    
    // Research modal system
    openResearchModal() {
        const modal = document.getElementById('researchModal');
        modal.style.display = 'flex';
        this.populateResearchModal();
    }
    
    closeResearchModal() {
        const modal = document.getElementById('researchModal');
        modal.style.display = 'none';
    }
    
    populateResearchModal() {
        // Update current level and progress
        document.getElementById('currentLevel').textContent = this.researchLevel;
        
        const nextLevel = this.researchLevel + 1;
        const requirements = this.researchRequirements[nextLevel];
        let progressPercent = 0;
        
        if (requirements) {
            let totalRequired = 0;
            let totalMet = 0;
            
            for (const [itemType, requiredAmount] of Object.entries(requirements.items)) {
                totalRequired += requiredAmount;
                totalMet += Math.min(this.resources[itemType] || 0, requiredAmount);
            }
            
            progressPercent = totalRequired > 0 ? (totalMet / totalRequired) * 100 : 0;
        }
        
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('progressText').textContent = `${Math.round(progressPercent)}%`;
        
        // Populate research levels
        const researchLevels = document.getElementById('researchLevels');
        researchLevels.innerHTML = '';
        
        for (let level = 1; level <= 8; level++) {
            const requirements = this.researchRequirements[level];
            const levelItem = document.createElement('div');
            
            let status = 'locked';
            let statusText = 'Locked';
            
            if (level <= this.researchLevel) {
                status = 'unlocked';
                statusText = 'Unlocked';
            } else if (level === this.researchLevel + 1) {
                status = 'current';
                statusText = 'Available';
            }
            
            levelItem.className = `research-level-item ${status}`;
            
            // Check if requirements are met
            let requirementsMet = true;
            if (requirements) {
                for (const [itemType, requiredAmount] of Object.entries(requirements.items)) {
                    if ((this.resources[itemType] || 0) < requiredAmount) {
                        requirementsMet = false;
                        break;
                    }
                }
            }
            
            levelItem.innerHTML = `
                <div class="research-level-header">
                    <span class="research-level-title">Research Level ${level}</span>
                    <span class="research-level-status ${status}">${statusText}</span>
                </div>
                ${requirements ? `
                    <div class="research-requirements">
                        <h4>Requirements:</h4>
                        <div class="research-requirements-list">
                            ${Object.entries(requirements.items).map(([itemType, amount]) => {
                                const hasEnough = (this.resources[itemType] || 0) >= amount;
                                return `<span class="research-requirement ${hasEnough ? 'met' : ''}">${this.recipes[itemType]?.icon || '❓'} ${amount} ${this.recipes[itemType]?.name || itemType}</span>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${requirements ? `
                    <div class="research-unlocks">
                        <h4>Unlocks:</h4>
                        <div class="research-unlocks-list">
                            ${requirements.unlocks.map(buildingType => {
                                const building = this.buildingTypes[buildingType];
                                return `<span class="research-unlock">${building.icon} ${building.name}</span>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${level === this.researchLevel + 1 && requirementsMet ? `
                    <button class="research-button" id="researchBtn${level}" onclick="game.advanceResearchLevel()">Research Level ${level}</button>
                ` : ''}
            `;
            
            researchLevels.appendChild(levelItem);
        }
    }
    
    // Settings modal system
    openHelpModal() {
        const modal = document.getElementById('helpModal');
        modal.style.display = 'flex';
    }
    
    closeHelpModal() {
        const modal = document.getElementById('helpModal');
        modal.style.display = 'none';
    }
    
    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'flex';
    }
    
    closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'none';
    }
    
    openDebugModal() {
        const modal = document.getElementById('debugModal');
        modal.style.display = 'flex';
        this.updateDebugDisplay();
    }
    
    closeDebugModal() {
        const modal = document.getElementById('debugModal');
        modal.style.display = 'none';
    }
    
    // Debug system
    updateDebugDisplay() {
        // Update resource display
        const resourceDisplay = document.getElementById('debugResourceDisplay');
        if (resourceDisplay) {
            let html = '';
            for (const [resource, amount] of Object.entries(this.resources)) {
                html += `<span class="debug-resource">${resource}: ${amount}</span> `;
            }
            resourceDisplay.innerHTML = html;
        }
        
        // Update power display
        const powerDisplay = document.getElementById('debugPowerDisplay');
        if (powerDisplay) {
            const efficiency = this.powerGrid.totalConsumption > 0 ? this.powerGrid.efficiency : 1.0;
            powerDisplay.textContent = `${this.powerGrid.totalProduction}/${this.powerGrid.totalConsumption} (${Math.round(efficiency * 100)}%)`;
        }
        
        // Update research display
        const researchDisplay = document.getElementById('debugResearchDisplay');
        if (researchDisplay) {
            researchDisplay.textContent = `Level ${this.researchLevel} (${this.researchProgress} points)`;
        }
        
        // Update building count
        const buildingCount = document.getElementById('debugBuildingCount');
        if (buildingCount) {
            buildingCount.textContent = this.buildings.size;
        }
    }
    
    setupDebugEventListeners() {
        // Resource buttons
        document.getElementById('addIronBtn').addEventListener('click', () => {
            this.resources.iron += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addCopperBtn').addEventListener('click', () => {
            this.resources.copper += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addGoldBtn').addEventListener('click', () => {
            this.resources.gold += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addSteelBtn').addEventListener('click', () => {
            this.resources.steel += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addGearBtn').addEventListener('click', () => {
            this.resources.gear += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addCircuitBtn').addEventListener('click', () => {
            this.resources.circuit += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addMotorBtn').addEventListener('click', () => {
            this.resources.motor += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addComputerBtn').addEventListener('click', () => {
            this.resources.computer += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addRobotBtn').addEventListener('click', () => {
            this.resources.robot += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addCoalBtn').addEventListener('click', () => {
            this.resources.coal += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('addUraniumBtn').addEventListener('click', () => {
            this.resources.uranium += 100;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        // Power buttons
        document.getElementById('addPowerBtn').addEventListener('click', () => {
            this.resources.power += 1000;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('maxPowerBtn').addEventListener('click', () => {
            this.resources.power = 999999;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        // Research buttons
        document.getElementById('addResearchBtn').addEventListener('click', () => {
            this.researchProgress += 100;
            this.checkResearchAdvancement();
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        document.getElementById('maxResearchBtn').addEventListener('click', () => {
            this.researchLevel = 8;
            this.researchProgress = 0;
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
        
        // Building management buttons
        document.getElementById('clearBuildingsBtn').addEventListener('click', () => {
            if (confirm('Clear all buildings?')) {
                this.buildings.clear();
                this.items.clear();
                this.storage.clear();
                this.draw();
                this.updateDebugDisplay();
            }
        });
        
        document.getElementById('unlockAllBtn').addEventListener('click', () => {
            // Unlock all items
            Object.keys(this.recipes).forEach(item => {
                this.discoveredItems.add(item);
            });
            
            // Unlock all research levels
            this.researchLevel = 8;
            this.researchProgress = 0;
            
            // Update recipe book if it's open
            const recipeBookModal = document.getElementById('recipeBookModal');
            if (recipeBookModal && recipeBookModal.style.display === 'flex') {
                this.populateRecipeBook();
            }
            
            this.updateResourceDisplay();
            this.updateDebugDisplay();
        });
    }
    
    // Reset game system
    resetGame() {
        if (confirm('Are you sure you want to reset the game? This will delete all progress and buildings.')) {
            // Reset game state
            this.resources = {
                iron: 8,
                copper: 0,
                ironRod: 0,
                copperRod: 0,
                steel: 0,
                gear: 0,
                circuit: 0,
                motor: 0,
                computer: 0,
                robot: 0,
                power: 0,
                coal: 5,
                uranium: 0,
                gold: 0
            };
            
            this.researchLevel = 0;
            this.researchProgress = 0;
            this.discoveredItems = new Set(['iron', 'coal']);
            this.buildings.clear();
            this.items.clear();
            this.storage.clear();
            this.selectedBuilding = null;
            this.selectedBuildingRotation = 0;
            this.camera.x = 0;
            this.camera.y = 0;
            this.tutorialCompleted = false;
            
            // Update UI
            this.updateResourceDisplay();
            this.updateBuildingAvailability();
            this.updateResearchGoal();
            this.draw();
            
            // Show tutorial again
            this.showTutorial();
            
            // Clear saved game
            localStorage.removeItem('factoryGameSave');
            
            console.log('Game reset successfully!');
        }
    }
    
    // Save game state to localStorage
    saveGame() {
        try {
            // Clear any pending debounced save
            if (this.saveTimer) {
                clearTimeout(this.saveTimer);
                this.saveTimer = null;
            }
            
            // Convert Sets and Maps to JSON-serializable formats
            const saveData = {
                resources: this.resources,
                powerGrid: this.powerGrid,
                discoveredItems: Array.from(this.discoveredItems), // Convert Set to Array
                researchLevel: this.researchLevel,
                researchProgress: this.researchProgress,
                buildings: Array.from(this.buildings.entries()).map(([key, building]) => [key, building]), // Convert Map to Array
                storage: Array.from(this.storage.entries()).map(([key, storage]) => [key, storage]), // Convert Map to Array
                camera: this.camera,
                spawnPoint: this.spawnPoint,
                tutorialCompleted: this.tutorialCompleted,
                version: '1.0' // Version for future compatibility
            };
            
            localStorage.setItem('factoryGameSave', JSON.stringify(saveData));
            // Only log saves for important actions (not debounced saves)
            // console.log('Game saved successfully!');
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }
    
    // Load game state from localStorage
    loadGame() {
        try {
            const saveDataStr = localStorage.getItem('factoryGameSave');
            if (!saveDataStr) {
                console.log('No saved game found. Starting fresh game.');
                return false; // No save data, start fresh
            }
            
            const saveData = JSON.parse(saveDataStr);
            
            // Restore resources
            if (saveData.resources) {
                this.resources = { ...this.resources, ...saveData.resources };
            }
            
            // Restore power grid
            if (saveData.powerGrid) {
                this.powerGrid = { ...this.powerGrid, ...saveData.powerGrid };
            }
            
            // Restore discovered items (convert Array back to Set)
            if (saveData.discoveredItems && Array.isArray(saveData.discoveredItems)) {
                this.discoveredItems = new Set(saveData.discoveredItems);
            }
            
            // Restore research
            if (saveData.researchLevel !== undefined) {
                this.researchLevel = saveData.researchLevel;
            }
            if (saveData.researchProgress !== undefined) {
                this.researchProgress = saveData.researchProgress;
            }
            
            // Restore buildings (convert Array back to Map)
            if (saveData.buildings && Array.isArray(saveData.buildings)) {
                this.buildings = new Map(saveData.buildings);
            }
            
            // Restore storage (convert Array back to Map)
            if (saveData.storage && Array.isArray(saveData.storage)) {
                this.storage = new Map(saveData.storage);
            }
            
            // Restore camera position
            if (saveData.camera) {
                this.camera = { ...this.camera, ...saveData.camera };
            }
            
            // Restore spawn point
            if (saveData.spawnPoint) {
                this.spawnPoint = { ...this.spawnPoint, ...saveData.spawnPoint };
            }
            
            // Restore tutorial status
            if (saveData.tutorialCompleted !== undefined) {
                this.tutorialCompleted = saveData.tutorialCompleted;
            }
            
            console.log('Game loaded successfully!');
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            return false;
        }
    }
    
    // Tutorial system
    showTutorial() {
        const tutorialOverlay = document.getElementById('hologramTutorial');
        tutorialOverlay.style.display = 'flex';
    }
    
    startTutorial() {
        const tutorialOverlay = document.getElementById('hologramTutorial');
        tutorialOverlay.style.display = 'none';
        
        this.tutorialActive = true;
        this.tutorialStep = 0;
        this.holograms = [];
        
        // Create tutorial holograms
        this.createTutorialHolograms();
        this.draw();
    }
    
    skipTutorial() {
        const tutorialOverlay = document.getElementById('hologramTutorial');
        tutorialOverlay.style.display = 'none';
        
        this.tutorialActive = false;
        this.tutorialCompleted = true;
        this.holograms = [];
        this.draw();
    }
    
    createTutorialHolograms() {
        // Clear existing holograms
        this.holograms = [];
        
        // Center the camera on the tutorial area
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Tutorial building positions (centered on screen)
        const centerX = Math.floor(this.canvas.width / 2 / this.gridSize);
        const centerY = Math.floor(this.canvas.height / 2 / this.gridSize);
        
        const tutorialBuildings = [
            { type: 'ironMiner', x: centerX - 1, y: centerY, step: 0 },
            { type: 'conveyor', x: centerX, y: centerY, step: 1 },
            { type: 'submitter', x: centerX + 1, y: centerY, step: 2 }
        ];
        
        tutorialBuildings.forEach(building => {
            this.holograms.push({
                type: building.type,
                x: building.x,
                y: building.y,
                step: building.step,
                active: building.step === this.tutorialStep
            });
        });
    }
    
    drawHolograms() {
        this.holograms.forEach(hologram => {
            if (hologram.active) {
                const screenX = hologram.x * this.gridSize - this.camera.x;
                const screenY = hologram.y * this.gridSize - this.camera.y;
                
                // Only draw if visible on screen
                if (screenX > -this.gridSize && screenX < this.canvas.width + this.gridSize &&
                    screenY > -this.gridSize && screenY < this.canvas.height + this.gridSize) {
                    
                    this.drawHologram(hologram, screenX, screenY);
                }
            }
        });
    }
    
    drawHologram(hologram, x, y) {
        const buildingType = this.buildingTypes[hologram.type];
        
        // Draw hologram background
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
        this.ctx.restore();
        
        // Draw hologram border
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
        this.ctx.restore();
        
        // Draw hologram icon
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillText(buildingType.icon, x + this.gridSize/2, y + this.gridSize/2);
        this.ctx.restore();
        
        // Draw input/output arrows for hologram
        this.drawHologramArrows(hologram, x, y);
    }
    
    drawHologramArrows(hologram, x, y) {
        const buildingType = this.buildingTypes[hologram.type];
        
        // Draw input arrows
        buildingType.inputs.forEach(direction => {
            this.drawHologramArrow(x, y, direction, '#00FF00');
        });
        
        // Draw output arrows
        buildingType.outputs.forEach(direction => {
            this.drawHologramArrow(x, y, direction, '#FF0000');
        });
    }
    
    drawHologramArrow(x, y, direction, color) {
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;
        const arrowSize = 8;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        
        let arrowX = centerX;
        let arrowY = centerY;
        let rotation = 0;
        
        switch (direction) {
            case 'up':
                arrowY = y;
                rotation = Math.PI;
                break;
            case 'down':
                arrowY = y + this.gridSize;
                rotation = 0;
                break;
            case 'left':
                arrowX = x;
                rotation = Math.PI / 2;
                break;
            case 'right':
                arrowX = x + this.gridSize;
                rotation = -Math.PI / 2;
                break;
        }
        
        this.ctx.translate(arrowX, arrowY);
        this.ctx.rotate(rotation);
        
        // Draw arrow
        this.ctx.beginPath();
        this.ctx.moveTo(0, -arrowSize);
        this.ctx.lineTo(-arrowSize/2, arrowSize/2);
        this.ctx.lineTo(arrowSize/2, arrowSize/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    handleTutorialClick(gridX, gridY) {
        // Find hologram at clicked position
        const clickedHologram = this.holograms.find(h => 
            h.x === gridX && h.y === gridY && h.active
        );
        
        if (clickedHologram) {
            // Place the building
            this.placeBuilding(gridX, gridY, clickedHologram.type);
            
            // Move to next tutorial step
            this.tutorialStep++;
            
            // Update hologram states
            this.holograms.forEach(h => {
                h.active = h.step === this.tutorialStep;
            });
            
            // Check if tutorial is complete
            if (this.tutorialStep >= this.holograms.length) {
                this.completeTutorial();
            }
            
            this.draw();
        }
    }
    
    placeBuilding(gridX, gridY, buildingType = null) {
        const type = buildingType || this.selectedBuilding;
        if (!type) return;
        
        const key = `${gridX},${gridY}`;
        
        // Check if position is occupied
        if (this.buildings.has(key)) {
            return;
        }
        
        // Check if we can afford it
        if (!this.canAfford(type)) {
            this.playSound('error');
            return;
        }
        
        // Place building
        this.buildings.set(key, {
            type: type,
            x: gridX,
            y: gridY,
            rotation: this.selectedBuildingRotation,
            lastProduction: null,
            processing: false,
            processingTime: 0
        });
        
        // Deduct cost
        const building = this.buildingTypes[type];
        if (building.costItems) {
            // Handle multi-resource costs
            for (const [resource, amount] of Object.entries(building.costItems)) {
                this.resources[resource] -= amount;
            }
        } else {
            // Handle legacy single-resource costs
            if (type === 'roller') {
                this.resources.copper -= building.cost;
            } else {
                this.resources.iron -= building.cost;
            }
        }
        
        // Clear selection
        this.selectedBuilding = null;
        this.selectedBuildingRotation = 0;
        
        // Play sound and update UI
        this.playSound('place');
        this.updateResourceDisplay();
        this.updateBuildingSelection();
        this.draw();
        
        // Save game state
        this.saveGame();
    }
    
    completeTutorial() {
        this.tutorialActive = false;
        this.tutorialCompleted = true;
        this.holograms = [];
        
        // Show completion message
        this.showNotification(
            '🎉 Tutorial Complete!',
            'You\'ve built your first factory! Now try building more advanced structures and research new technologies.',
            'Continue'
        );
        
        this.draw();
        
        // Save game state
        this.saveGame();
    }
    
    showNotification(title, message, buttonText = 'OK') {
        // Remove any existing notification
        const existingNotification = document.querySelector('.game-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-button" onclick="this.parentElement.remove()">${buttonText}</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new FactoryGame();
});

