class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 18;
        this.speed = 3.8;
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxMana = 100;
        this.mana = 100;
        this.potions = 3;
        this.keys = 0;
        this.hasRuinKey = false;
        
        // Combat & Dash state
        this.facingAngle = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDuration = 10; // frames
        this.dashDirection = { x: 0, y: 0 };
        this.invincibilityFrames = 0;
        
        // Sword swing arc state
        this.swordTimer = 0;
        this.swordDuration = 12; // frames
        this.swordAngleSweep = 0;
        
        // Projectiles list
        this.projectiles = [];
        this.activeWeapon = 1; // 1 = Sword, 2 = Spell
        
        // Footstep smoke timer
        this.stepTimer = 0;
        
        // Spritesheet animation
        this.animFrame = 0;
        this.animTimer = 0;
    }

    resetStats() {
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.potions = 3;
        this.keys = 0;
        this.hasRuinKey = false;
        this.projectiles = [];
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.swordTimer = 0;
        this.invincibilityFrames = 0;
    }

    takeDamage(amount) {
        if (this.invincibilityFrames > 0 || this.isDashing) return;
        
        this.health = Math.max(0, this.health);
        this.health -= amount;
        this.invincibilityFrames = 30; // 0.5s at 60fps
        audio.playPlayerHit();
        particles.spawnHitSparks(this.x, this.y, '#ff0054');
        
        // Trigger screen shake in main engine
        if (window.triggerScreenShake) {
            window.triggerScreenShake(200);
        }
    }

    usePotion() {
        if (this.potions > 0 && this.health < this.maxHealth) {
            this.potions--;
            this.health = Math.min(this.maxHealth, this.health + 45);
            audio.playHeal();
            
            // Spawn healing sparkle particles around player
            for (let i = 0; i < 15; i++) {
                const vx = (Math.random() - 0.5) * 1.5;
                const vy = -Math.random() * 2 - 0.5;
                particles.list.push(new Particle(
                    this.x + (Math.random() - 0.5) * 20, 
                    this.y + (Math.random() - 0.5) * 20, 
                    vx, vy, 
                    Math.random() * 3 + 2, 
                    '#00f5d4', 
                    1.0, 
                    0.02, 
                    'physics'
                ));
            }
            this.updateHUD();
        }
    }

    dash(keys) {
        if (this.dashCooldown > 0 || this.isDashing) return;

        // Determine dash direction from keys
        let dx = 0;
        let dy = 0;
        if (keys['w'] || keys['ArrowUp']) dy = -1;
        if (keys['s'] || keys['ArrowDown']) dy = 1;
        if (keys['a'] || keys['ArrowLeft']) dx = -1;
        if (keys['d'] || keys['ArrowRight']) dx = 1;

        // If no movement keys are pressed, dash in facing direction
        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.facingAngle);
            dy = Math.sin(this.facingAngle);
        }

        // Normalize direction
        const len = Math.sqrt(dx * dx + dy * dy);
        this.dashDirection.x = dx / len;
        this.dashDirection.y = dy / len;

        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = 45; // 0.75s cooldown
        
        audio.playDash();
    }

    attackSword(mousePos, camera, useKeyboardAim = false) {
        if (this.isDashing || this.swordTimer > 0) return;
        
        if (!useKeyboardAim) {
            // Calculate angle to mouse position
            const dx = mousePos.x + camera.x - this.x;
            const dy = mousePos.y + camera.y - this.y;
            this.facingAngle = Math.atan2(dy, dx);
        }
        
        this.swordTimer = this.swordDuration;
        this.swordAngleSweep = -Math.PI / 3.5; // Start angle relative to face
        
        audio.playSword();
        
        // Check melee hit against active enemies
        if (window.enemiesList) {
            window.enemiesList.forEach(e => {
                const edx = e.x - this.x;
                const edy = e.y - this.y;
                const dist = Math.sqrt(edx * edx + edy * edy);
                
                // Within range (65px sword range)
                if (dist < 68 + e.radius) {
                    const angleToEnemy = Math.atan2(edy, edx);
                    
                    // Check if enemy is in the front slash cone (approx 120 degrees wide)
                    let angleDiff = angleToEnemy - this.facingAngle;
                    
                    // Normalize angle difference to -PI to PI
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    
                    if (Math.abs(angleDiff) < Math.PI / 2.5) {
                        e.takeDamage(25); // Sword damage
                    }
                }
            });
        }
    }

    castSpell(mousePos, camera, useKeyboardAim = false) {
        if (this.isDashing || this.mana < 20) return;
        
        this.mana -= 20;
        audio.playBlast();
        this.updateHUD();

        let angle = this.facingAngle;
        if (!useKeyboardAim) {
            // Calculate angle to mouse
            const dx = mousePos.x + camera.x - this.x;
            const dy = mousePos.y + camera.y - this.y;
            angle = Math.atan2(dy, dx);
            this.facingAngle = angle;
        }

        // Spawn aether projectile
        const speed = 7.5;
        this.projectiles.push({
            x: this.x + Math.cos(angle) * 15,
            y: this.y + Math.sin(angle) * 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 8,
            damage: 35,
            life: 60 // 1 second
        });
    }

    update(keys, mousePos, camera) {
        // Cooldown ticks
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invincibilityFrames > 0) this.invincibilityFrames--;
        
        // Regen Mana
        if (this.mana < this.maxMana && !this.isDashing) {
            this.mana = Math.min(this.maxMana, this.mana + 0.12);
            this.updateHUD();
        }

        // Handle Active Dash
        if (this.isDashing) {
            const currentDashSpeed = this.speed * 2.8;
            this.vx = this.dashDirection.x * currentDashSpeed;
            this.vy = this.dashDirection.y * currentDashSpeed;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Visual ghost sprites
            particles.spawnDashTrail(this.x, this.y, this.radius);

            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.vx = 0;
                this.vy = 0;
            }
        } 
        
        // Regular Movement
        else {
            let dx = 0;
            let dy = 0;
            if (keys['w'] || keys['ArrowUp']) dy = -1;
            if (keys['s'] || keys['ArrowDown']) dy = 1;
            if (keys['a'] || keys['ArrowLeft']) dx = -1;
            if (keys['d'] || keys['ArrowRight']) dx = 1;
            
            // If moving, update movement and footprint dust particles
            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.vx = (dx / len) * this.speed;
                this.vy = (dy / len) * this.speed;
                
                this.x += this.vx;
                this.y += this.vy;
                
                // Update facing angle towards direction of movement if not aiming
                if (mousePos.x === 0 && mousePos.y === 0) {
                    this.facingAngle = Math.atan2(this.vy, this.vx);
                }

                // Sprite walk cycle ticking
                this.animTimer++;
                if (this.animTimer >= 7) {
                    this.animFrame = (this.animFrame + 1) % 4;
                    this.animTimer = 0;
                }

                // Spawning dust particles
                this.stepTimer++;
                if (this.stepTimer % 12 === 0) {
                    particles.spawnDust(this.x, this.y + 16);
                }
            } else {
                this.vx = 0;
                this.vy = 0;
                this.animFrame = 0; // idle frame
                this.animTimer = 0;
            }

            // Aim facing angle towards mouse cursor (only if mouse has moved)
            if (mousePos.x !== 0 || mousePos.y !== 0) {
                const adx = mousePos.x + camera.x - this.x;
                const ady = mousePos.y + camera.y - this.y;
                this.facingAngle = Math.atan2(ady, adx);
            }
        }

        // Apply environment collisions
        const collision = gameMap.checkCollision(this.x, this.y, this.radius);
        if (collision.collided) {
            this.x += collision.pushX;
            this.y += collision.pushY;
        }

        // Keep player in map boundaries
        this.x = Math.max(this.radius + 50, Math.min(gameMap.width - this.radius - 50, this.x));
        this.y = Math.max(this.radius + 50, Math.min(gameMap.height - this.radius - 50, this.y));

        // Manage Sword swing ticks
        if (this.swordTimer > 0) {
            this.swordTimer--;
            this.swordAngleSweep += (Math.PI * 2 / 3.5) / this.swordDuration;
        }

        // Manage Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            // Particle embers trailing the spell blast
            particles.spawnEmber(p.x, p.y, '#00f5d4');

            // Collision check with walls
            const hitWall = gameMap.checkCollision(p.x, p.y, p.radius);
            
            // Collision check with enemies
            let hitEnemy = false;
            if (window.enemiesList) {
                for (let j = 0; j < window.enemiesList.length; j++) {
                    const e = window.enemiesList[j];
                    const edx = e.x - p.x;
                    const edy = e.y - p.y;
                    const dist = Math.sqrt(edx * edx + edy * edy);
                    if (dist < p.radius + e.radius) {
                        e.takeDamage(p.damage);
                        hitEnemy = true;
                        break;
                    }
                }
            }

            if (p.life <= 0 || hitWall.collided || hitEnemy) {
                particles.spawnSpellExplosion(p.x, p.y);
                this.projectiles.splice(i, 1);
            }
        }
        
        // Void pool damage (Level 2 special hazard)
        if (gameMap.currentLevel === 2) {
            gameMap.levels[2].decorations.forEach(d => {
                if (d.type === 'void_pool') {
                    if (this.x > d.x && this.x < d.x + d.w && this.y > d.y && this.y < d.y + d.h) {
                        this.takeDamage(1.5); // DPS style void burn
                    }
                }
            });
        }
    }

    draw(ctx, camera) {
        const px = this.x - camera.x;
        const py = this.y - camera.y;

        // 1. Draw Player Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(px, py + 16, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw active spell projectiles
        this.projectiles.forEach(p => {
            const sx = p.x - camera.x;
            const sy = p.y - camera.y;
            
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f5d4';
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#00f5d4';
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });

        // 3. Draw Player Body facing direction
        if (window.playerSheetImg && window.playerSheetImg.complete && window.playerSheetImg.width > 0) {
            ctx.save();
            ctx.translate(px, py);
            
            // Map angle to spritesheet row (Down: 0, Left: 1, Right: 2, Up: 3)
            let angle = this.facingAngle;
            while (angle < -Math.PI) angle += Math.PI * 2;
            while (angle > Math.PI) angle -= Math.PI * 2;
            
            let row = 0; // Down
            if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
                row = 2; // Right
            } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
                row = 0; // Down
            } else if (angle >= -3 * Math.PI / 4 && angle < -Math.PI / 4) {
                row = 3; // Up
            } else {
                row = 1; // Left
            }

            if (this.invincibilityFrames > 0 && Math.floor(this.invincibilityFrames / 3) % 2 === 0) {
                ctx.globalAlpha = 0.3;
            }

            const fw = window.playerSheetImg.width / 4;
            const fh = window.playerSheetImg.height / 4;
            ctx.drawImage(
                window.playerSheetImg,
                this.animFrame * fw,
                row * fh,
                fw,
                fh,
                -24, // offset x (center it)
                -30, // offset y
                48,  // width
                56   // height
            );
            ctx.restore();
        } else {
            // Draw Fallback programmatic vector shape
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(this.facingAngle);

            // Invincibility flicker
            if (this.invincibilityFrames > 0 && Math.floor(this.invincibilityFrames / 3) % 2 === 0) {
                ctx.globalAlpha = 0.3;
            }

            // Draw Robe/Armor
            ctx.fillStyle = '#7b2cbf'; // deep purple mage-warrior robe
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Armor plates (shoulders/chests)
            ctx.fillStyle = '#1d3557';
            ctx.fillRect(-6, -15, 12, 6);
            ctx.fillRect(-6, 9, 12, 6);
            
            // Mage collar / cowl
            ctx.fillStyle = '#9d4edd';
            ctx.beginPath();
            ctx.arc(-2, 0, 13, -Math.PI / 1.5, Math.PI / 1.5);
            ctx.fill();

            // Glowing Core Markings
            ctx.fillStyle = '#00f5d4';
            ctx.beginPath();
            ctx.arc(2, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Face visor
            ctx.fillStyle = '#100c22';
            ctx.beginPath();
            ctx.arc(6, 0, 8, -Math.PI / 2.5, Math.PI / 2.5);
            ctx.fill();

            // Glowing cyan eye band visor
            ctx.fillStyle = '#00f5d4';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f5d4';
            ctx.fillRect(8, -4, 4, 8);
            ctx.shadowBlur = 0;

            ctx.restore();
        }

        // 4. Draw Melee Sword Swing sweeping slash arcs
        if (this.swordTimer > 0) {
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(this.facingAngle + this.swordAngleSweep);
            
            // Draw sword item
            ctx.strokeStyle = '#e2def0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(40, -10);
            ctx.stroke();

            // Guard and hilt
            ctx.strokeStyle = '#ffb703';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(8, -14);
            ctx.lineTo(8, -2);
            ctx.stroke();

            // Slash translucent vapor arc
            ctx.fillStyle = 'rgba(0, 245, 212, 0.15)';
            ctx.strokeStyle = 'rgba(0, 245, 212, 0.7)';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00f5d4';
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.arc(0, 0, 48, -Math.PI / 4, Math.PI / 4);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    updateHUD() {
        const hpPercent = Math.max(0, (this.health / this.maxHealth) * 100);
        const mpPercent = Math.max(0, (this.mana / this.maxMana) * 100);
        
        document.getElementById('health-bar').style.width = hpPercent + '%';
        document.getElementById('mana-bar').style.width = mpPercent + '%';
        
        document.getElementById('potion-count').innerText = this.potions;
        document.getElementById('key-count').innerText = this.keys;
    }
}

// Global Player Instance
const player = new Player(100, 500);
// Helper function to drink health potion
function usePotion() {
    player.usePotion();
}
window.usePotion = usePotion;
