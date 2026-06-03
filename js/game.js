const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Preload Spritesheets & Tileset
window.tilesetImg = new Image();
window.tilesetImg.src = 'assets/tileset.png';
window.playerSheetImg = new Image();
window.playerSheetImg.src = 'assets/player_spritesheet.png';
window.enemiesSheetImg = new Image();
window.enemiesSheetImg.src = 'assets/enemies_spritesheet.png';


// Camera representation
const camera = {
    x: 0,
    y: 0,
    w: canvas.width,
    h: canvas.height,
    lerpSpeed: 0.08
};

// Keyboard inputs tracker
const keys = {};

// Mouse state representation
const mousePos = { x: 0, y: 0 };

// Screen shaking state variables
let shakeDuration = 0;
let shakeIntensity = 0;

// Game State tracker: 'menu', 'dialogue', 'playing', 'gameover', 'victory'
let gameState = 'menu';

// Current active level identifier
let currentLevel = 1;

// Shop overlay open state
let shopOpen = false;

// Hit freeze frame duration
let hitFreezeFrames = 0;

// Loot and particle drops list
window.lootList = [];

class Loot {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1; // slight pop upwards
        this.type = type; // 'coin', 'heart', 'mana'
        this.radius = 8;
        this.bounceTimer = 25; // bounce frames
        this.friction = 0.94;
    }

    update(player) {
        if (this.bounceTimer > 0) {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.bounceTimer--;
        } else {
            // Magnetic pull
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const pullSpeed = 5.5 * (1 - dist / 150) + 2.0;
                this.x += (dx / dist) * pullSpeed;
                this.y += (dy / dist) * pullSpeed;
            }
        }
    }

    draw(ctx, camera) {
        const lx = this.x - camera.x;
        const ly = this.y - camera.y;
        
        ctx.save();
        ctx.shadowBlur = 8;
        if (this.type === 'coin') {
            ctx.fillStyle = '#ffb703';
            ctx.shadowColor = '#ffb703';
            ctx.beginPath();
            ctx.arc(lx, ly, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(lx, ly, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'heart') {
            ctx.fillStyle = '#ff0054';
            ctx.shadowColor = '#ff0054';
            ctx.beginPath();
            ctx.moveTo(lx, ly + 4);
            ctx.bezierCurveTo(lx - 5, ly - 2, lx - 5, ly - 7, lx, ly - 4);
            ctx.bezierCurveTo(lx + 5, ly - 7, lx + 5, ly - 2, lx, ly + 4);
            ctx.fill();
        } else if (this.type === 'mana') {
            ctx.fillStyle = '#00f5d4';
            ctx.shadowColor = '#00f5d4';
            ctx.beginPath();
            ctx.moveTo(lx, ly - 7);
            ctx.lineTo(lx + 5, ly);
            ctx.lineTo(lx, ly + 7);
            ctx.lineTo(lx - 5, ly);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

window.spawnLoot = function(x, y, sourceType) {
    if (sourceType === 'pot') {
        const count = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            window.lootList.push(new Loot(x, y, 'coin'));
        }
        if (Math.random() < 0.15) window.lootList.push(new Loot(x, y, 'heart'));
        if (Math.random() < 0.10) window.lootList.push(new Loot(x, y, 'mana'));
    } else if (sourceType === 'bush') {
        if (Math.random() < 0.4) {
            window.lootList.push(new Loot(x, y, 'coin'));
        }
        if (Math.random() < 0.10) window.lootList.push(new Loot(x, y, 'heart'));
        if (Math.random() < 0.10) window.lootList.push(new Loot(x, y, 'mana'));
    } else {
        const count = Math.floor(Math.random() * 3) + 2; // 2-4 coins
        for (let i = 0; i < count; i++) {
            window.lootList.push(new Loot(x, y, 'coin'));
        }
        if (Math.random() < 0.25) window.lootList.push(new Loot(x, y, 'heart'));
        if (Math.random() < 0.25) window.lootList.push(new Loot(x, y, 'mana'));
    }
};

// Dialogue sequence states
let dialogueQueue = [];
let currentDialogueIndex = 0;
let isTyping = false;
let typeText = "";
let typeTimer = null;
let onDialogueFinish = null;

// Track level states / flags
let forestKeyFound = false;
let sageInteractionDone = false;
let bossTriggered = false;

// Input action event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Shop interaction slot selection bypass
    if (shopOpen) {
        if (e.key === '1') { buyShopItem(1); e.preventDefault(); return; }
        if (e.key === '2') { buyShopItem(2); e.preventDefault(); return; }
        if (e.key === '3') { buyShopItem(3); e.preventDefault(); return; }
        if (e.key === '4') { buyShopItem(4); e.preventDefault(); return; }
        if (e.key === 'Escape') { closeShop(); e.preventDefault(); return; }
    }

    // Quick keys mapping
    if (e.key === ' ' || e.key === 'Spacebar' || e.key.toLowerCase() === 'v') {
        player.dash(keys);
    }
    if (e.key.toLowerCase() === 'e') {
        player.usePotion();
    }
    if (e.key.toLowerCase() === 'q') {
        player.castFlameNova();
    }
    if (e.key.toLowerCase() === 'x') {
        player.attackSword(mousePos, camera, true);
    }
    if (e.key.toLowerCase() === 'c') {
        player.castSpell(mousePos, camera, true);
    }
    if (e.key.toLowerCase() === '1') {
        player.activeWeapon = 1;
        updateWeaponBelt();
    }
    if (e.key.toLowerCase() === '2') {
        player.activeWeapon = 2;
        updateWeaponBelt();
    }
    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            showScreen('settings-screen');
            gameState = 'settings';
        } else if (gameState === 'settings') {
            closeSettings();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'playing') return;
    
    // Left click
    if (e.button === 0) {
        if (player.activeWeapon === 1) {
            player.attackSword(mousePos, camera);
        } else {
            player.castSpell(mousePos, camera);
        }
    }
    // Right click
    else if (e.button === 2) {
        player.castSpell(mousePos, camera);
    }
});

// Prevent default context menu on right click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Custom external hooks for trigger effects
window.triggerScreenShake = function(durationMs, intensity = 6) {
    shakeDuration = Math.floor(durationMs / 16.6); // translate ms to frames
    shakeIntensity = intensity;
};

// HUD Updates helper methods
function updateWeaponBelt() {
    document.getElementById('slot-1').classList.toggle('active', player.activeWeapon === 1);
    document.getElementById('slot-2').classList.toggle('active', player.activeWeapon === 2);
}

// Routes and Screens triggers
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'menu-screen') {
        gameState = 'menu';
        audio.stopMusic();
    } else if (screenId === 'settings-screen') {
        // preserve running music settings
    }
}
window.showScreen = showScreen;

function closeSettings() {
    document.getElementById('settings-screen').classList.remove('active');
    if (gameState === 'settings') {
        gameState = 'playing';
    } else {
        showScreen('menu-screen');
    }
}
window.closeSettings = closeSettings;

function startGame() {
    audio.init();
    audio.startMusic();
    
    // Reset flags
    forestKeyFound = false;
    sageInteractionDone = false;
    bossTriggered = false;
    
    document.getElementById('boss-health-container').style.display = 'none';

    // Set Level 1 properties
    currentLevel = 1;
    gameMap.loadLevel(1);
    
    // Reset player position and stats
    player.x = gameMap.levels[1].playerSpawn.x;
    player.y = gameMap.levels[1].playerSpawn.y;
    player.resetStats();
    player.updateHUD();

    // Spawn level monsters
    window.spawnLevelEnemies(1);
    
    // Clear particle trails and loot lists
    particles.clear();
    window.lootList = [];
    
    // Hide shop overlay
    document.getElementById('shop-overlay').classList.remove('active');
    shopOpen = false;
    
    // Close overlays and set game state to start
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    gameState = 'playing';
    
    // Start opening dialogue
    startOpeningDialogue();
}
window.startGame = startGame;

function updateVolume(type, val) {
    audio.updateVolume(type, val);
}
window.updateVolume = updateVolume;

// --- Dialogue Tree Engine ---
function startDialogue(queue, onFinish = null) {
    dialogueQueue = queue;
    currentDialogueIndex = 0;
    onDialogueFinish = onFinish;
    gameState = 'dialogue';
    
    document.getElementById('dialogue-overlay').style.display = 'flex';
    displayDialogueNode();
}

function displayDialogueNode() {
    if (currentDialogueIndex >= dialogueQueue.length) {
        closeDialogue();
        return;
    }

    const node = dialogueQueue[currentDialogueIndex];
    document.getElementById('dialogue-name').innerText = node.name;
    document.getElementById('dialogue-portrait').style.backgroundImage = `url('${node.portrait}')`;
    
    // Typewriting effect
    isTyping = true;
    typeText = node.text;
    let charIdx = 0;
    
    const textContainer = document.getElementById('dialogue-text');
    textContainer.innerText = "";
    
    if (typeTimer) clearInterval(typeTimer);
    
    typeTimer = setInterval(() => {
        textContainer.innerText += typeText[charIdx];
        charIdx++;
        if (charIdx >= typeText.length) {
            clearInterval(typeTimer);
            isTyping = false;
        }
    }, 20); // 20ms per character
}

function advanceDialogue() {
    if (isTyping) {
        // Skip typewriting
        clearInterval(typeTimer);
        document.getElementById('dialogue-text').innerText = typeText;
        isTyping = false;
    } else {
        currentDialogueIndex++;
        displayDialogueNode();
    }
}
window.advanceDialogue = advanceDialogue;

function closeDialogue() {
    document.getElementById('dialogue-overlay').style.display = 'none';
    gameState = 'playing';
    if (onDialogueFinish) {
        onDialogueFinish();
        onDialogueFinish = null;
    }
}

// Quest dialogue templates
function startOpeningDialogue() {
    startDialogue([
        {
            name: "Krieger-Magier",
            portrait: "assets/player_portrait.png",
            text: "Wo bin ich?... Diese Wälder strahlen eine seltsame Energie aus. Ich sollte mich umsehen."
        }
    ]);
}

function triggerSageDialogue() {
    sageInteractionDone = true;
    startDialogue([
        {
            name: "Weiser Eulenmeister",
            portrait: "assets/sage_portrait.png",
            text: "Ah, ein Reisender! Sei gegrüßt. Das Dunkle Void dringt aus den Ruinen im Osten hervor und verpestet die Natur."
        },
        {
            name: "Krieger-Magier",
            portrait: "assets/player_portrait.png",
            text: "Ich habe die Energie gespürt. Kann ich die Ruinen betreten und das Portal versiegeln?"
        },
        {
            name: "Weiser Eulenmeister",
            portrait: "assets/sage_portrait.png",
            text: "Das Tor ist verschlossen. Du benötigst den antiken Ruinen-Schlüssel. Er liegt in einer Truhe im tiefen Nordosten des Waldes vergraben."
        },
        {
            name: "Weiser Eulenmeister",
            portrait: "assets/sage_portrait.png",
            text: "Nimm dich vor den Schattenkriechern in Acht. Nimm diesen Trank, er wird dich heilen."
        }
    ], () => {
        // Sage awards potion
        player.potions++;
        player.updateHUD();
        document.getElementById('quest-description').innerText = "Suche den Ruinen-Schlüssel in der Truhe im Nordosten.";
        audio.playQuest();
    });
}

function triggerKeyDialogue() {
    startDialogue([
        {
            name: "Krieger-Magier",
            portrait: "assets/player_portrait.png",
            text: "Hier ist er... Der antike Ruinen-Schlüssel! Er glänzt in einem seltsamen gelben Licht."
        },
        {
            name: "Krieger-Magier",
            portrait: "assets/player_portrait.png",
            text: "Ich sollte sofort zum Steintor im Osten aufbrechen."
        }
    ], () => {
        forestKeyFound = true;
        player.keys = 1;
        player.updateHUD();
        
        // Active forest portal door
        gameMap.portal.active = true;
        
        document.getElementById('quest-description').innerText = "Betritt die Ruinen durch das Portal im Osten.";
        audio.playQuest();
    });
}

function triggerRuinEntranceDialogue() {
    startDialogue([
        {
            name: "Krieger-Magier",
            portrait: "assets/player_portrait.png",
            text: "Diese Mauern... Sie zerfallen unter der Macht des Void. Und diese Pfützen aus lila Feuer verbrennen alles."
        },
        {
            name: "Krieger-Magier",
            portrait: "assets/player_portrait.png",
            text: "Ich muss das Zentrum erreichen. Hier patrouillieren mächtige Leuchtfeuer-Sentries. Ich muss vorsichtig sein!"
        }
    ], () => {
        document.getElementById('quest-description').innerText = "Erforsche die Ruinen und finde den Void-Rift.";
    });
}

function triggerBossEntranceDialogue() {
    bossTriggered = true;
    document.getElementById('boss-health-container').style.display = 'flex';
    document.getElementById('boss-health-bar').style.width = '100%';

    startDialogue([
        {
            name: "Void Guardian",
            portrait: "assets/boss_portrait.png",
            text: "STÖRENFRIED... Du wagst es, den Void-Rift zu entweihen? Deine Seele wird mir gehören!"
        },
        {
            name: "Krieger-Magier",
            portrait: "assets/player_portrait.png",
            text: "Deine Herrschaft über Aetheria endet hier, Titan. Bereite dich auf den Kampf vor!"
        }
    ], () => {
        document.getElementById('quest-description').innerText = "Besiege den Void Guardian!";
    });
}


// --- Main Engine Loop ---
function update() {
    if (hitFreezeFrames > 0) {
        hitFreezeFrames--;
        return;
    }

    if (gameState === 'playing' || gameState === 'dialogue') {
        
        // Update particles always (keeps animations smooth behind dialogue)
        particles.update();

        if (gameState === 'playing') {
            // Update Player
            player.update(keys, mousePos, camera);
            
            // Check interactions with level entities
            // 1. NPC collision check
            let nearSage = false;
            gameMap.npcs.forEach(npc => {
                if (npc.id === 'sage') {
                    const dx = player.x - npc.x;
                    const dy = player.y - npc.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60) {
                        nearSage = true;
                        if (!sageInteractionDone) {
                            triggerSageDialogue();
                        }
                    }
                }
            });

            // Toggle shop overlay based on proximity
            if (nearSage && sageInteractionDone) {
                if (!shopOpen) {
                    document.getElementById('shop-overlay').classList.add('active');
                    shopOpen = true;
                }
            } else {
                if (shopOpen) {
                    document.getElementById('shop-overlay').classList.remove('active');
                    shopOpen = false;
                }
            }

            // 2. Chest collision check
            gameMap.chests.forEach(chest => {
                if (!chest.opened) {
                    const dx = player.x - chest.x;
                    const dy = player.y - (chest.y + 12);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 32) {
                        chest.opened = true;
                        
                        if (chest.item === 'Schlüssel') {
                            triggerKeyDialogue();
                        } else if (chest.item === 'Trank') {
                            player.potions++;
                            player.updateHUD();
                            audio.playHeal();
                            particles.spawnHitSparks(chest.x + 16, chest.y + 12, '#00f5d4');
                        }
                    }
                }
            });

            // 3. Portal transitions check
            if (gameMap.portal && gameMap.portal.active) {
                const p = gameMap.portal;
                // bounding box collision for doorway
                if (player.x > p.x && player.x < p.x + p.w && player.y > p.y && player.y < p.y + p.h) {
                    // Transition to next level
                    currentLevel = p.destLevel;
                    gameMap.loadLevel(currentLevel);
                    
                    // Reset player positions based on level spawn coordinates
                    player.x = gameMap.levels[currentLevel].playerSpawn.x;
                    player.y = gameMap.levels[currentLevel].playerSpawn.y;
                    player.projectiles = [];
                    
                    window.spawnLevelEnemies(currentLevel);
                    particles.clear();
                    window.lootList = []; // clear old level drops
                    audio.playDoorOpen();
                    
                    if (currentLevel === 2) {
                        triggerRuinEntranceDialogue();
                    } else if (currentLevel === 3) {
                        triggerBossEntranceDialogue();
                    }
                }
            }

            // Update Loot list
            for (let i = window.lootList.length - 1; i >= 0; i--) {
                const loot = window.lootList[i];
                loot.update(player);
                
                // Collection check
                const dx = player.x - loot.x;
                const dy = player.y - loot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < player.radius + loot.radius) {
                    // Collected!
                    if (loot.type === 'coin') {
                        player.coins += 1;
                        audio.playSFX(600, 900, 'sine', 0.08, 0.25);
                    } else if (loot.type === 'heart') {
                        player.health = Math.min(player.maxHealth, player.health + 15);
                        audio.playHeal();
                    } else if (loot.type === 'mana') {
                        player.mana = Math.min(player.maxMana, player.mana + 25);
                        audio.playHeal();
                    }
                    particles.spawnCoinSparkles(loot.x, loot.y);
                    player.updateHUD();
                    window.lootList.splice(i, 1);
                }
            }

            // Update Monsters
            for (let i = window.enemiesList.length - 1; i >= 0; i--) {
                const enemy = window.enemiesList[i];
                enemy.update(player);

                if (enemy.health <= 0) {
                    // Spawn custom death visual effects
                    if (enemy.type === 'boss') {
                        audio.playBossDeath();
                        particles.spawnSpellExplosion(enemy.x, enemy.y);
                        
                        // Spawn boss loot explosion
                        for (let k = 0; k < 12; k++) {
                            window.lootList.push(new Loot(enemy.x, enemy.y, 'coin'));
                        }
                        
                        // Victory sequence trigger
                        gameState = 'victory';
                        showScreen('victory-screen');
                        audio.stopMusic();
                        audio.playWin();
                    } else {
                        // Regular mob death drops
                        audio.playSFX(100, 30, 'triangle', 0.15, 0.4);
                        particles.spawnSpellExplosion(enemy.x, enemy.y);
                        
                        // Spawn loot
                        window.spawnLoot(enemy.x, enemy.y, enemy.type);
                    }
                    window.enemiesList.splice(i, 1);
                }
            }

            // Update Void projectles
            for (let i = window.voidProjectiles.length - 1; i >= 0; i--) {
                const vp = window.voidProjectiles[i];
                vp.x += vp.vx;
                vp.y += vp.vy;
                vp.life--;

                particles.spawnEmber(vp.x, vp.y, vp.color);

                // Collision check void projectile with player
                const dx = player.x - vp.x;
                const dy = player.y - vp.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < player.radius + vp.radius) {
                    player.takeDamage(vp.damage);
                    window.voidProjectiles.splice(i, 1);
                    continue;
                }

                // Collision check void projectile with walls
                const hitWall = gameMap.checkCollision(vp.x, vp.y, vp.radius);

                if (vp.life <= 0 || hitWall.collided) {
                    particles.spawnHitSparks(vp.x, vp.y, vp.color);
                    window.voidProjectiles.splice(i, 1);
                }
            }

            // Game Over checks
            if (player.health <= 0) {
                gameState = 'gameover';
                showScreen('gameover-screen');
                audio.stopMusic();
                audio.playLose();
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Camera following player exactly zentriert
    const targetCamX = player.x - canvas.width / 2;
    const targetCamY = player.y - canvas.height / 2;
    camera.x += (targetCamX - camera.x) * camera.lerpSpeed;
    camera.y += (targetCamY - camera.y) * camera.lerpSpeed;

    // Clamp camera within map bounds
    camera.x = Math.max(0, Math.min(gameMap.width - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(gameMap.height - canvas.height, camera.y));

    // Handle Screenshake translate factors
    ctx.save();
    if (shakeDuration > 0) {
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(shakeX, shakeY);
        shakeDuration--;
        // shake frame damping
        shakeIntensity *= 0.92;
    }

    // Apply viewport camera translate
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Ground tilemap and environmental decals
    gameMap.draw(ctx, camera);

    // 2. Draw active player & monsters
    player.draw(ctx, camera);
    
    window.enemiesList.forEach(e => e.draw(ctx, camera));

    // 3. Draw active enemy projectiles
    window.voidProjectiles.forEach(vp => {
        const vx = vp.x - camera.x;
        const vy = vp.y - camera.y;
        
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = vp.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(vx, vy, vp.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = vp.color;
        ctx.beginPath();
        ctx.arc(vx, vy, vp.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = vp.color;
        ctx.stroke();
        ctx.restore();
    });

    // Draw active loot items
    window.lootList.forEach(l => l.draw(ctx, camera));

    // 4. Draw active glowing particles list
    particles.draw(ctx);

    // Restore translate state
    ctx.restore();

    // 5. Draw dark ambient lighting mask overlay on top of scene
    if (gameState === 'playing' || gameState === 'dialogue') {
        gameMap.drawLightingMask(ctx, camera, player);
    }

    // 6. Draw HUD Minimap
    drawMinimap();
}

// Main game portal tick loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Initial settings layout binds
updateWeaponBelt();
requestAnimationFrame(loop);

// Screen dynamic auto-scaling
function resizeGame() {
    const container = document.getElementById('game-container');
    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetRatio = 1024 / 576;
    const currentRatio = w / h;
    let scale = 1;
    if (currentRatio > targetRatio) {
        scale = h / 576;
    } else {
        scale = w / 1024;
    }
    container.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', resizeGame);
window.addEventListener('load', resizeGame);
setTimeout(resizeGame, 50);

// --- Minimap and Shop Utilities ---
function drawMinimap() {
    if (gameState !== 'playing' && gameState !== 'dialogue') return;
    
    ctx.save();
    
    // Position HUD top-right
    const mapW = 120;
    const mapH = 90;
    const mapX = canvas.width - mapW - 20;
    const mapY = 80;
    
    // Frosted glass background
    ctx.fillStyle = 'rgba(10, 8, 18, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 8);
    ctx.fill();
    ctx.stroke();
    
    // Clip contents
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 8);
    ctx.clip();
    
    const scaleX = mapW / gameMap.width;
    const scaleY = mapH / gameMap.height;
    
    // Draw Chests & Keys (Yellow)
    gameMap.chests.forEach(c => {
        if (!c.opened) {
            ctx.fillStyle = '#ffb703';
            ctx.beginPath();
            ctx.arc(mapX + c.x * scaleX, mapY + c.y * scaleY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw Portal
    if (gameMap.portal) {
        ctx.fillStyle = gameMap.portal.active ? '#00f5d4' : '#6b705c';
        ctx.fillRect(
            mapX + gameMap.portal.x * scaleX, 
            mapY + gameMap.portal.y * scaleY, 
            gameMap.portal.w * scaleX, 
            gameMap.portal.h * scaleY
        );
    }
    
    // Draw NPC Sage (Green)
    gameMap.npcs.forEach(n => {
        ctx.fillStyle = '#38b000';
        ctx.beginPath();
        ctx.arc(mapX + n.x * scaleX, mapY + n.y * scaleY, 4.5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw Monsters (Red)
    if (window.enemiesList) {
        window.enemiesList.forEach(e => {
            ctx.fillStyle = '#ff0054';
            ctx.beginPath();
            ctx.arc(mapX + e.x * scaleX, mapY + e.y * scaleY, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Draw Player (Blue)
    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.arc(mapX + player.x * scaleX, mapY + player.y * scaleY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function buyShopItem(index) {
    if (gameState !== 'playing') return;
    
    if (index === 1) {
        if (player.coins >= 20) {
            player.coins -= 20;
            player.potions++;
            audio.playHeal();
            particles.spawnCoinSparkles(player.x, player.y);
            player.updateHUD();
        } else {
            audio.playSFX(150, 100, 'sawtooth', 0.15, 0.4); // negative buzzer
        }
    } else if (index === 2) {
        if (player.coins >= 50) {
            player.coins -= 50;
            player.swordDamage += 5;
            audio.playQuest();
            particles.spawnCoinSparkles(player.x, player.y);
            player.updateHUD();
        } else {
            audio.playSFX(150, 100, 'sawtooth', 0.15, 0.4);
        }
    } else if (index === 3) {
        if (player.coins >= 75) {
            player.coins -= 75;
            player.maxHealth += 20;
            player.health = player.maxHealth;
            audio.playHeal();
            particles.spawnCoinSparkles(player.x, player.y);
            player.updateHUD();
        } else {
            audio.playSFX(150, 100, 'sawtooth', 0.15, 0.4);
        }
    } else if (index === 4) {
        if (player.coins >= 75) {
            player.coins -= 75;
            player.maxMana += 20;
            player.mana = player.maxMana;
            audio.playHeal();
            particles.spawnCoinSparkles(player.x, player.y);
            player.updateHUD();
        } else {
            audio.playSFX(150, 100, 'sawtooth', 0.15, 0.4);
        }
    }
}
window.buyShopItem = buyShopItem;

function closeShop() {
    document.getElementById('shop-overlay').classList.remove('active');
    shopOpen = false;
}
window.closeShop = closeShop;

// Shop backdrop overlay close click listener
document.getElementById('shop-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'shop-overlay' || e.target.classList.contains('shop-close-prompt')) {
        closeShop();
    }
});

