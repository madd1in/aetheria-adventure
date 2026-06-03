class GameMap {
    constructor() {
        this.currentLevel = 1;
        this.width = 1500;
        this.height = 900;
        
        // Levels definition list
        this.levels = {
            1: {
                name: "Das Whispering Woods",
                width: 1600,
                height: 1000,
                playerSpawn: { x: 100, y: 500 },
                ambientLight: 0.85, // Relatively bright daylight
                groundColor: '#1d3527',
                decorations: [
                    // Trees (circle/rect colliders mapped in collisions list)
                    { type: 'tree', x: 200, y: 150, r: 40 },
                    { type: 'tree', x: 400, y: 200, r: 40 },
                    { type: 'tree', x: 150, y: 700, r: 40 },
                    { type: 'tree', x: 800, y: 300, r: 40 },
                    { type: 'tree', x: 700, y: 800, r: 40 },
                    { type: 'tree', x: 1200, y: 200, r: 40 },
                    { type: 'tree', x: 1300, y: 700, r: 40 },
                    { type: 'shrub', x: 120, y: 400 },
                    { type: 'shrub', x: 600, y: 600 },
                    { type: 'shrub', x: 1100, y: 150 },
                    { type: 'flower', x: 300, y: 300, color: '#00f5d4' },
                    { type: 'flower', x: 1000, y: 850, color: '#9d4edd' }
                ],
                colliders: [
                    // Outer bounds
                    { x: 0, y: 0, w: 1600, h: 50 }, // Top
                    { x: 0, y: 950, w: 1600, h: 50 }, // Bottom
                    { x: 0, y: 0, w: 50, h: 1000 }, // Left
                    { x: 1550, y: 0, w: 50, h: 1000 }, // Right
                    
                    // Natural obstacles
                    { x: 200, y: 150, w: 60, h: 60, isTree: true },
                    { x: 400, y: 200, w: 60, h: 60, isTree: true },
                    { x: 150, y: 700, w: 60, h: 60, isTree: true },
                    { x: 800, y: 300, w: 60, h: 60, isTree: true },
                    { x: 700, y: 800, w: 60, h: 60, isTree: true },
                    { x: 1200, y: 200, w: 60, h: 60, isTree: true },
                    { x: 1300, y: 700, w: 60, h: 60, isTree: true },
                    
                    // Ancient stone wall blockages
                    { x: 600, y: 50, w: 80, h: 350 },
                    { x: 600, y: 600, w: 80, h: 350 }
                ],
                chests: [
                    { id: 'woods_chest1', x: 500, y: 100, opened: false, item: 'Trank' },
                    { id: 'woods_key_chest', x: 1400, y: 150, opened: false, item: 'Schlüssel' }
                ],
                npcs: [
                    { id: 'sage', name: 'Weiser Eulenmeister', x: 1050, y: 500, talking: false }
                ],
                lights: [
                    { x: 1050, y: 500, radius: 180, color: 'rgba(0, 245, 212, 0.45)' }, // Sage's grove glow
                    { x: 1400, y: 150, radius: 120, color: 'rgba(255, 215, 0, 0.3)' }   // Key light
                ],
                enemies: [
                    { x: 500, y: 480, type: 'crawler' },
                    { x: 900, y: 200, type: 'crawler' },
                    { x: 850, y: 780, type: 'crawler' }
                ],
                portal: { x: 1500, y: 500, w: 50, h: 80, active: false, destLevel: 2 },
                destructibles: [
                    { type: 'pot', x: 300, y: 450, w: 32, h: 32, hp: 1 },
                    { type: 'pot', x: 340, y: 450, w: 32, h: 32, hp: 1 },
                    { type: 'bush', x: 750, y: 250, w: 36, h: 36, hp: 1 },
                    { type: 'bush', x: 790, y: 270, w: 36, h: 36, hp: 1 },
                    { type: 'pot', x: 1300, y: 250, w: 32, h: 32, hp: 1 },
                    { type: 'bush', x: 1350, y: 220, w: 36, h: 36, hp: 1 }
                ]
            },
            2: {
                name: "Die Ruinen von Aetheria",
                width: 1600,
                height: 1000,
                playerSpawn: { x: 100, y: 500 },
                ambientLight: 0.25, // Dark dungeons, torches required
                groundColor: '#120e1e',
                decorations: [
                    { type: 'ruin_pillar', x: 300, y: 250 },
                    { type: 'ruin_pillar', x: 500, y: 750 },
                    { type: 'ruin_pillar', x: 900, y: 250 },
                    { type: 'ruin_pillar', x: 1100, y: 750 },
                    // Void Pools (damages player)
                    { type: 'void_pool', x: 650, y: 400, w: 250, h: 200 }
                ],
                colliders: [
                    // Outer bounds
                    { x: 0, y: 0, w: 1600, h: 50 },
                    { x: 0, y: 950, w: 1600, h: 50 },
                    { x: 0, y: 0, w: 50, h: 1000 },
                    { x: 1550, y: 0, w: 50, h: 1000 },
                    
                    // Ruins interior layout walls
                    { x: 300, y: 250, w: 60, h: 60 },
                    { x: 500, y: 750, w: 60, h: 60 },
                    { x: 900, y: 250, w: 60, h: 60 },
                    { x: 1100, y: 750, w: 60, h: 60 },
                    
                    // Barriers dividing the rooms
                    { x: 400, y: 50, w: 80, h: 350 },
                    { x: 400, y: 600, w: 80, h: 350 },
                    { x: 1100, y: 50, w: 80, h: 350 },
                    { x: 1100, y: 600, w: 80, h: 350 }
                ],
                chests: [
                    { id: 'ruins_chest1', x: 750, y: 150, opened: false, item: 'Trank' },
                    { id: 'ruins_chest2', x: 750, y: 800, opened: false, item: 'Trank' }
                ],
                npcs: [],
                lights: [
                    // Torches throughout the hallway
                    { x: 200, y: 200, radius: 150, color: 'rgba(255, 107, 53, 0.45)' },
                    { x: 200, y: 800, radius: 150, color: 'rgba(255, 107, 53, 0.45)' },
                    { x: 750, y: 150, radius: 120, color: 'rgba(255, 107, 53, 0.45)' },
                    { x: 750, y: 800, radius: 120, color: 'rgba(255, 107, 53, 0.45)' },
                    { x: 1350, y: 200, radius: 150, color: 'rgba(255, 107, 53, 0.45)' },
                    { x: 1350, y: 800, radius: 150, color: 'rgba(255, 107, 53, 0.45)' },
                    // Glowing void pool light
                    { x: 775, y: 500, radius: 250, color: 'rgba(157, 78, 221, 0.3)' }
                ],
                enemies: [
                    { x: 300, y: 500, type: 'crawler' },
                    { x: 600, y: 200, type: 'crawler' },
                    { x: 600, y: 800, type: 'crawler' },
                    { x: 950, y: 200, type: 'sentry' },
                    { x: 950, y: 800, type: 'sentry' },
                    { x: 1300, y: 500, type: 'crawler' }
                ],
                portal: { x: 1500, y: 500, w: 50, h: 80, active: true, destLevel: 3 },
                destructibles: [
                    { type: 'pot', x: 250, y: 250, w: 32, h: 32, hp: 1 },
                    { type: 'pot', x: 250, y: 750, w: 32, h: 32, hp: 1 },
                    { type: 'pot', x: 700, y: 180, w: 32, h: 32, hp: 1 },
                    { type: 'pot', x: 800, y: 180, w: 32, h: 32, hp: 1 },
                    { type: 'pot', x: 700, y: 820, w: 32, h: 32, hp: 1 },
                    { type: 'pot', x: 800, y: 820, w: 32, h: 32, hp: 1 }
                ]
            },
            3: {
                name: "Der Void Rift (Boss-Arena)",
                width: 1024,
                height: 576,
                playerSpawn: { x: 150, y: 288 },
                ambientLight: 0.15, // Almost dark, portal & boss light up
                groundColor: '#050209',
                decorations: [
                    { type: 'rift_center', x: 512, y: 288 }
                ],
                colliders: [
                    // Outer walls
                    { x: 0, y: 0, w: 1024, h: 50 },
                    { x: 0, y: 526, w: 1024, h: 50 },
                    { x: 0, y: 0, w: 50, h: 576 },
                    { x: 974, y: 0, w: 50, h: 576 }
                ],
                chests: [],
                npcs: [],
                lights: [
                    // Giant center portal glowing
                    { x: 800, y: 288, radius: 350, color: 'rgba(157, 78, 221, 0.4)' }
                ],
                enemies: [
                    { x: 750, y: 288, type: 'boss' }
                ],
                portal: null // Ending scene
            }
        };

        this.loadLevel(1);
    }

    loadLevel(lvlId) {
        this.currentLevel = lvlId;
        const lvl = this.levels[lvlId];
        this.width = lvl.width;
        this.height = lvl.height;
        this.ambientLight = lvl.ambientLight;
        
        // Clone mutable instances
        this.colliders = JSON.parse(JSON.stringify(lvl.colliders));
        this.chests = JSON.parse(JSON.stringify(lvl.chests));
        this.npcs = JSON.parse(JSON.stringify(lvl.npcs));
        this.lights = JSON.parse(JSON.stringify(lvl.lights));
        this.portal = lvl.portal ? JSON.parse(JSON.stringify(lvl.portal)) : null;
        this.enemies = JSON.parse(JSON.stringify(lvl.enemies));
        this.destructibles = lvl.destructibles ? JSON.parse(JSON.stringify(lvl.destructibles)) : [];
    }

    draw(ctx, camera) {
        const lvl = this.levels[this.currentLevel];
        const useTileset = window.tilesetImg && window.tilesetImg.complete && window.tilesetImg.width > 0;
        
        // Draw solid background color first to blend textures
        ctx.fillStyle = lvl.groundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        if (useTileset) {
            const sw = window.tilesetImg.width / 4;
            const sh = window.tilesetImg.height / 4;
            // Floor tile coordinate matching: Grass (0,0) for Level 1, Stone (1,0) for Level 2 & 3
            const floorX = this.currentLevel === 1 ? 0 : 1;
            const floorY = 0;
            
            // Loop tiles within viewport camera boundaries (grid size 48)
            const startX = Math.floor(camera.x / 48) * 48;
            const startY = Math.floor(camera.y / 48) * 48;
            const endX = Math.min(this.width, camera.x + camera.w + 48);
            const endY = Math.min(this.height, camera.y + camera.h + 48);
            
            ctx.save();
            ctx.globalAlpha = 0.45; // Soft blending to hide tile seams
            for (let x = startX; x < endX; x += 48) {
                for (let y = startY; y < endY; y += 48) {
                    ctx.drawImage(
                        window.tilesetImg,
                        floorX * sw,
                        floorY * sh,
                        sw,
                        sh,
                        x - 0.5, // 0.5px overlap prevents subpixel rendering gaps
                        y - 0.5,
                        49,      // 49px size covers overlaps
                        49
                    );
                }
            }
            ctx.restore();
        } else {
            // Draw grid lines to suggest detailed paving tiles
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            const gridSize = 48;
            for (let x = 0; x < this.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.height);
                ctx.stroke();
            }
            for (let y = 0; y < this.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
        }

        // Draw level portals, decorations, obstacles
        if (this.currentLevel === 1) {
            // Level 1: Woods details
            // Mossy patterns
            if (!useTileset) {
                ctx.fillStyle = '#172b20';
                ctx.fillRect(300, 400, 200, 150);
                ctx.fillRect(1000, 100, 300, 200);
            }

            // Obstacles
            this.colliders.forEach(c => {
                if (c.isTree) {
                    // Draw tree trunk and shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.beginPath();
                    ctx.ellipse(c.x + 30, c.y + 45, 25, 12, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    if (useTileset) {
                        const sw = window.tilesetImg.width / 4;
                        const sh = window.tilesetImg.height / 4;
                        // Slice tree from Row 0, Col 3
                        ctx.drawImage(window.tilesetImg, 3 * sw, 0 * sh, sw, sh, c.x, c.y - 12, 60, 72);
                    } else {
                        // Trunk
                        ctx.fillStyle = '#4c2f13';
                        ctx.fillRect(c.x + 20, c.y + 20, 20, 25);
                        
                        // Foliage
                        ctx.fillStyle = '#2d5a27';
                        ctx.beginPath();
                        ctx.arc(c.x + 30, c.y + 10, 40, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (c.y !== 0 && c.x !== 0 && c.w !== 1600 && c.h !== 1000) {
                    // Walls / barriers
                    if (useTileset) {
                        const sw = window.tilesetImg.width / 4;
                        const sh = window.tilesetImg.height / 4;
                        // Tiled wall brick slices (Row 1, Col 0)
                        for (let wx = c.x; wx < c.x + c.w; wx += 48) {
                            for (let wy = c.y; wy < c.y + c.h; wy += 48) {
                                const dw = Math.min(48, c.x + c.w - wx);
                                const dh = Math.min(48, c.y + c.h - wy);
                                ctx.drawImage(window.tilesetImg, 0 * sw, 1 * sh, (dw/48)*sw, (dh/48)*sh, wx, wy, dw, dh);
                            }
                        }
                    } else {
                        // Stone bricks barriers fallback
                        ctx.fillStyle = '#3a3a4c';
                        ctx.strokeStyle = '#4e4e66';
                        ctx.lineWidth = 2;
                        ctx.fillRect(c.x, c.y, c.w, c.h);
                        ctx.strokeRect(c.x, c.y, c.w, c.h);
                    }
                }
            });

            // Sage grove visual accent
            ctx.fillStyle = 'rgba(0, 245, 212, 0.05)';
            ctx.beginPath();
            ctx.arc(1050, 500, 120, 0, Math.PI*2);
            ctx.fill();
        } 
        
        else if (this.currentLevel === 2) {
            // Level 2: Ruins details
            // Void pool danger zones
            lvl.decorations.forEach(d => {
                if (d.type === 'void_pool') {
                    if (useTileset) {
                        const sw = window.tilesetImg.width / 4;
                        const sh = window.tilesetImg.height / 4;
                        // Void pool tiles tiled across width/height (Row 1, Col 2)
                        for (let px = d.x; px < d.x + d.w; px += 48) {
                            for (let py = d.y; py < d.y + d.h; py += 48) {
                                const dw = Math.min(48, d.x + d.w - px);
                                const dh = Math.min(48, d.y + d.h - py);
                                ctx.drawImage(window.tilesetImg, 2 * sw, 1 * sh, (dw/48)*sw, (dh/48)*sh, px, py, dw, dh);
                            }
                        }
                    } else {
                        ctx.fillStyle = 'rgba(123, 44, 191, 0.4)';
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#9d4edd';
                        ctx.fillRect(d.x, d.y, d.w, d.h);
                        ctx.shadowBlur = 0;
                        
                        ctx.strokeStyle = '#9d4edd';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(d.x, d.y, d.w, d.h);
                    }

                    // Glowing floating particles over the pool
                    particles.spawnPortalVortex(d.x + d.w/2, d.y + d.h/2, 100);
                }
            });

            // Pillars and barriers
            this.colliders.forEach(c => {
                if (c.y !== 0 && c.x !== 0 && c.w !== 1600 && c.h !== 1000) {
                    if (useTileset) {
                        const sw = window.tilesetImg.width / 4;
                        const sh = window.tilesetImg.height / 4;
                        // Brick wall tiles repeated (Row 1, Col 0)
                        for (let wx = c.x; wx < c.x + c.w; wx += 48) {
                            for (let wy = c.y; wy < c.y + c.h; wy += 48) {
                                const dw = Math.min(48, c.x + c.w - wx);
                                const dh = Math.min(48, c.y + c.h - wy);
                                ctx.drawImage(window.tilesetImg, 0 * sw, 1 * sh, (dw/48)*sw, (dh/48)*sh, wx, wy, dw, dh);
                            }
                        }
                    } else {
                        ctx.fillStyle = '#221930';
                        ctx.strokeStyle = '#4c2e6b';
                        ctx.lineWidth = 2;
                        ctx.fillRect(c.x, c.y, c.w, c.h);
                        ctx.strokeRect(c.x, c.y, c.w, c.h);
                        
                        // Details
                        ctx.fillStyle = '#4c2e6b';
                        ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, 10);
                    }
                }
            });
        } 
        
        else if (this.currentLevel === 3) {
            // Level 3: Void rift boss stage
            // Void backdrop space
            ctx.fillStyle = 'rgba(15, 10, 27, 0.8)';
            ctx.beginPath();
            ctx.arc(800, 288, 150, 0, Math.PI*2);
            ctx.fill();
            
            // Draw void portals spawning swirls
            particles.spawnPortalVortex(800, 288, 120);

            // Borders
            this.colliders.forEach(c => {
                if (c.y !== 0 && c.x !== 0 && c.w !== 1024 && c.h !== 576) {
                    if (useTileset) {
                        const sw = window.tilesetImg.width / 4;
                        const sh = window.tilesetImg.height / 4;
                        for (let wx = c.x; wx < c.x + c.w; wx += 48) {
                            for (let wy = c.y; wy < c.y + c.h; wy += 48) {
                                const dw = Math.min(48, c.x + c.w - wx);
                                const dh = Math.min(48, c.y + c.h - wy);
                                ctx.drawImage(window.tilesetImg, 0 * sw, 1 * sh, (dw/48)*sw, (dh/48)*sh, wx, wy, dw, dh);
                            }
                        }
                    } else {
                        ctx.fillStyle = '#140c22';
                        ctx.fillRect(c.x, c.y, c.w, c.h);
                    }
                }
            });
        }

        // Draw interactive chests
        this.chests.forEach(ch => {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(ch.x - 5, ch.y + 12, 42, 12); // Shadow

            if (useTileset) {
                const sw = window.tilesetImg.width / 4;
                const sh = window.tilesetImg.height / 4;
                const col = ch.opened ? 1 : 0; // Row 2, Col 0: Closed chest, Col 1: Open chest
                ctx.drawImage(window.tilesetImg, col * sw, 2 * sh, sw, sh, ch.x - 4, ch.y - 4, 40, 40);
            } else {
                if (ch.opened) {
                    // Open chest drawing
                    ctx.fillStyle = '#8b5a2b';
                    ctx.fillRect(ch.x, ch.y + 10, 32, 14);
                    ctx.fillStyle = '#5c3a21';
                    ctx.fillRect(ch.x, ch.y, 32, 10);
                } else {
                    // Closed chest drawing
                    ctx.fillStyle = '#b87333';
                    ctx.fillRect(ch.x, ch.y, 32, 24);
                    ctx.fillStyle = '#ffb703';
                    ctx.fillRect(ch.x + 12, ch.y + 8, 8, 8); // Lock
                }
            }
        });

        // Draw destructibles
        this.destructibles.forEach(d => {
            if (d.hp <= 0) return;
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(d.x - 2, d.y + d.h - 6, d.w + 4, 6); // shadow

            if (useTileset) {
                const sw = window.tilesetImg.width / 4;
                const sh = window.tilesetImg.height / 4;
                const col = d.type === 'pot' ? 2 : 3; // Row 2, Col 2: Pot, Col 3: Bush
                ctx.drawImage(window.tilesetImg, col * sw, 2 * sh, sw, sh, d.x, d.y, d.w, d.h);
            } else {
                if (d.type === 'pot') {
                    ctx.fillStyle = '#b75d32';
                    ctx.fillRect(d.x, d.y, d.w, d.h);
                    ctx.fillStyle = '#9b4f28';
                    ctx.fillRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
                } else {
                    ctx.fillStyle = '#2d6a4f';
                    ctx.beginPath();
                    ctx.arc(d.x + d.w/2, d.y + d.h/2, d.w/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // Draw portals
        if (this.portal) {
            const p = this.portal;
            if (useTileset) {
                const sw = window.tilesetImg.width / 4;
                const sh = window.tilesetImg.height / 4;
                const col = (this.currentLevel === 1 && !p.active) ? 3 : 1; // Inactive: Row 1, Col 3, Active: Row 1, Col 1
                ctx.drawImage(window.tilesetImg, col * sw, 1 * sh, sw, sh, p.x, p.y, p.w, p.h);
                if (col === 1) {
                    particles.spawnPortalVortex(p.x + p.w / 2, p.y + p.h / 2, 40);
                }
            } else {
                if (this.currentLevel === 1 && !p.active) {
                    // Inactive stone gateway
                    ctx.fillStyle = '#2f3e46';
                    ctx.fillRect(p.x, p.y, p.w, p.h);
                    ctx.fillStyle = '#3a3d40';
                    ctx.fillRect(p.x + 10, p.y + 10, p.w - 20, p.h - 20);
                } else {
                    // Glowing active portal vortex
                    ctx.fillStyle = 'rgba(0, 245, 212, 0.2)';
                    ctx.fillRect(p.x, p.y, p.w, p.h);
                    
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00f5d4';
                    ctx.fillStyle = '#00f5d4';
                    ctx.fillRect(p.x + 10, p.y, p.w - 20, p.h);
                    ctx.shadowBlur = 0;
                    
                    particles.spawnPortalVortex(p.x + p.w / 2, p.y + p.h / 2, 40);
                }
            }
        }

        // Draw NPCs
        this.npcs.forEach(n => {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(n.x, n.y + 20, 20, 0, Math.PI * 2);
            ctx.fill();

            // Robes
            ctx.fillStyle = '#1d3f58';
            ctx.beginPath();
            ctx.arc(n.x, n.y + 5, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Feather head
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(n.x, n.y - 12, 14, 0, Math.PI * 2);
            ctx.fill();

            // Golden staff
            ctx.strokeStyle = '#e9c46a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(n.x - 20, n.y + 25);
            ctx.lineTo(n.x - 20, n.y - 25);
            ctx.stroke();

            // Glowing staff gem
            ctx.fillStyle = '#00f5d4';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f5d4';
            ctx.beginPath();
            ctx.arc(n.x - 20, n.y - 25, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            particles.spawnEmber(n.x - 20, n.y - 25, '#00f5d4');
        });

        // Spawn decorative embers for lights (torches)
        this.lights.forEach(l => {
            if (l.color.includes('255, 107, 53')) { // Torches
                particles.spawnEmber(l.x, l.y - 10, '#ff6b35');
            }
        });
    }

    // Apply dark lighting mask layer
    drawLightingMask(ctx, camera, player) {
        // Create an overlay mask off-screen canvas size
        ctx.save();
        
        // Multiplied darkening overlay
        ctx.fillStyle = `rgba(5, 3, 10, ${1 - this.ambientLight})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Subtracted/Screened lights overlay
        ctx.globalCompositeOperation = 'destination-out';

        // 1. Draw Player light cone
        const px = player.x - camera.x;
        const py = player.y - camera.y;
        
        let grad = ctx.createRadialGradient(px, py, 10, px, py, 140);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 140, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw map light sources
        this.lights.forEach(l => {
            const lx = l.x - camera.x;
            const ly = l.y - camera.y;
            
            // Add a dynamic flicker effect to torch lights
            let radius = l.radius;
            if (l.color.includes('255, 107, 53')) { // Torches
                radius += Math.sin(Date.now() * 0.01 + l.x) * 6 + (Math.random() - 0.5) * 2;
            }
            
            grad = ctx.createRadialGradient(lx, ly, 5, lx, ly, radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(lx, ly, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // 3. Draw player spell lighting triggers
        if (player.projectiles) {
            player.projectiles.forEach(p => {
                const sx = p.x - camera.x;
                const sy = p.y - camera.y;
                grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 80);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx, sy, 80, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        ctx.restore();
    }

    checkCollision(x, y, radius) {
        // Check circle collision with all map box colliders
        for (let i = 0; i < this.colliders.length; i++) {
            const c = this.colliders[i];
            
            // Find closest point on bounding box
            const closestX = Math.max(c.x, Math.min(x, c.x + c.w));
            const closestY = Math.max(c.y, Math.min(y, c.y + c.h));
            
            // Calculate distance
            const distanceX = x - closestX;
            const distanceY = y - closestY;
            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
            
            if (distanceSquared < (radius * radius)) {
                // Collided! Calculate pushing vector
                const dist = Math.sqrt(distanceSquared);
                const overlap = radius - dist;
                
                let pushX = 0;
                let pushY = 0;
                
                if (dist > 0) {
                    pushX = (distanceX / dist) * overlap;
                    pushY = (distanceY / dist) * overlap;
                } else {
                    // Exactly in center, push away randomly
                    pushX = overlap;
                }
                
                return { collided: true, pushX, pushY };
            }
        }
        return { collided: false, pushX: 0, pushY: 0 };
    }
}

// Global Map Instance
const gameMap = new GameMap();
