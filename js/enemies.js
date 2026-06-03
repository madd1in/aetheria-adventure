class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'crawler', 'sentry', 'boss'
        
        // Base attributes depending on enemy type
        if (type === 'crawler') {
            this.maxHealth = 40;
            this.health = 40;
            this.radius = 16;
            this.speed = 1.9;
            this.damage = 12;
            this.color = '#ff4d6d'; // neon red
            this.biteCooldown = 0;
            this.state = 'patrol'; // patrol, chase
        } else if (type === 'sentry') {
            this.maxHealth = 50;
            this.health = 50;
            this.radius = 18;
            this.speed = 1.2;
            this.damage = 18;
            this.color = '#7209b7'; // void violet
            this.shootCooldown = 0;
            this.state = 'patrol';
        } else if (type === 'boss') {
            this.maxHealth = 600;
            this.health = 600;
            this.radius = 42;
            this.speed = 2.0;
            this.damage = 25;
            this.color = '#4c068d'; // giant purple golem
            this.bossPhase = 1; // 1, 2, 3
            this.attackTimer = 0;
            this.state = 'idle'; // idle, chase, spiral, sweep
            this.shootAngle = 0;
            this.laserIndicatorActive = false;
            this.laserAngle = 0;
            this.laserTimer = 0;
        }

        // Patrol points
        this.spawnX = x;
        this.spawnY = y;
        this.patrolTarget = { x: x, y: y };
        this.patrolTimer = 0;
        
        this.facingAngle = 0;
        this.flashTicks = 0; // Flash white on damage
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTicks = 6;
        audio.playHit();
        particles.spawnHitSparks(this.x, this.y, this.type === 'boss' ? '#9d4edd' : '#ff0054');

        if (this.type === 'boss') {
            const hPercent = Math.max(0, (this.health / this.maxHealth) * 100);
            document.getElementById('boss-health-bar').style.width = hPercent + '%';
            
            // Phase triggers
            if (this.health <= 200 && this.bossPhase < 3) {
                this.bossPhase = 3;
                this.speed = 2.4;
                audio.playSFX(100, 300, 'sawtooth', 0.8, 1.2);
                particles.spawnSpellExplosion(this.x, this.y);
            } else if (this.health <= 400 && this.bossPhase < 2) {
                this.bossPhase = 2;
                this.state = 'spiral';
                audio.playSFX(200, 500, 'sine', 0.6, 1.0);
                particles.spawnSpellExplosion(this.x, this.y);
            }
        }
    }

    update(player) {
        if (this.flashTicks > 0) this.flashTicks--;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // --- CRAWLER AI ---
        if (this.type === 'crawler') {
            if (this.biteCooldown > 0) this.biteCooldown--;

            if (dist < 320) {
                this.state = 'chase';
            } else if (dist > 450) {
                this.state = 'patrol';
            }

            if (this.state === 'chase') {
                this.facingAngle = Math.atan2(dy, dx);
                this.x += Math.cos(this.facingAngle) * this.speed;
                this.y += Math.sin(this.facingAngle) * this.speed;

                // Collision damage attack
                if (dist < this.radius + player.radius) {
                    if (this.biteCooldown === 0) {
                        player.takeDamage(this.damage);
                        this.biteCooldown = 50; // 0.83s
                    }
                }
            } else {
                this.doPatrol();
            }
        }

        // --- SENTRY AI ---
        else if (this.type === 'sentry') {
            if (this.shootCooldown > 0) this.shootCooldown--;

            if (dist < 380) {
                this.state = 'combat';
            } else if (dist > 480) {
                this.state = 'patrol';
            }

            if (this.state === 'combat') {
                this.facingAngle = Math.atan2(dy, dx);

                // Keep distance: retreat if player gets too close, move forward if too far
                if (dist < 160) {
                    // Back away
                    this.x -= Math.cos(this.facingAngle) * this.speed * 0.8;
                    this.y -= Math.sin(this.facingAngle) * this.speed * 0.8;
                } else if (dist > 250) {
                    // Move closer
                    this.x += Math.cos(this.facingAngle) * this.speed;
                    this.y += Math.sin(this.facingAngle) * this.speed;
                }

                // Shoot void orb projectile
                if (this.shootCooldown === 0) {
                    this.shootOrb(player);
                    this.shootCooldown = 90; // 1.5s at 60fps
                }
            } else {
                this.doPatrol();
            }
        }

        // --- VOID GUARDIAN BOSS AI ---
        else if (this.type === 'boss') {
            this.facingAngle = Math.atan2(dy, dx);

            // Phase 1: Melee chase and crush
            if (this.bossPhase === 1) {
                this.state = 'chase';
                this.x += Math.cos(this.facingAngle) * this.speed;
                this.y += Math.sin(this.facingAngle) * this.speed;

                if (dist < this.radius + player.radius + 15) {
                    this.attackTimer++;
                    if (this.attackTimer >= 40) { // slam attack every ~0.66s
                        player.takeDamage(this.damage);
                        this.attackTimer = 0;
                        particles.spawnHitSparks(player.x, player.y, '#9d4edd');
                        audio.playSFX(120, 40, 'triangle', 0.25, 0.7);
                    }
                }
            } 
            
            // Phase 2: Stand in center and cast fire spirals
            else if (this.bossPhase === 2) {
                // Move towards center first
                const cx = 512;
                const cy = 288;
                const cdx = cx - this.x;
                const cdy = cy - this.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

                if (cdist > 10) {
                    this.x += (cdx / cdist) * this.speed * 1.5;
                    this.y += (cdy / cdist) * this.speed * 1.5;
                } else {
                    // Fire rotating dual spiral lasers/orbs
                    this.shootAngle += 0.04;
                    this.attackTimer++;
                    if (this.attackTimer % 8 === 0) {
                        this.spawnBossProjectile(this.x, this.y, this.shootAngle, 4);
                        this.spawnBossProjectile(this.x, this.y, this.shootAngle + Math.PI, 4);
                        audio.playSFX(500, 250, 'sine', 0.1, 0.25);
                    }
                }
            } 
            
            // Phase 3: Desperation! Summon rifts and sweep giant laser beam
            else if (this.bossPhase === 3) {
                // Chase slowly
                this.x += Math.cos(this.facingAngle) * this.speed * 0.7;
                this.y += Math.sin(this.facingAngle) * this.speed * 0.7;

                this.attackTimer++;
                
                // Attack A: Fire circular rings of 8 bullets every 3 seconds (180 frames)
                if (this.attackTimer % 180 === 0) {
                    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                        this.spawnBossProjectile(this.x, this.y, angle, 3.5);
                    }
                    audio.playSFX(200, 80, 'triangle', 0.3, 0.5);
                }

                // Attack B: Spawn void crawlers from center rift portals
                if (this.attackTimer % 450 === 0 && window.enemiesList.length < 5) {
                    // Spawn crawler
                    window.enemiesList.push(new Enemy(150, 150, 'crawler'));
                    window.enemiesList.push(new Enemy(850, 420, 'crawler'));
                    particles.spawnSpellExplosion(150, 150);
                    particles.spawnSpellExplosion(850, 420);
                    audio.playQuest();
                }

                // Attack C: Giant laser sweep warning indicator -> sweep beam
                if (this.attackTimer % 360 === 100) { // Start warning
                    this.laserIndicatorActive = true;
                    this.laserAngle = this.facingAngle; // aim at player
                    this.laserTimer = 45; // 0.75s warning
                    audio.playSFX(80, 800, 'sawtooth', 0.7, 0.4);
                }

                if (this.laserIndicatorActive) {
                    this.laserTimer--;
                    if (this.laserTimer <= 0) {
                        this.laserIndicatorActive = false;
                        // Execute beam sweep
                        this.state = 'laser_sweep';
                        this.laserTimer = 60; // 1s beam sweep duration
                    }
                }

                if (this.state === 'laser_sweep') {
                    this.laserTimer--;
                    this.laserAngle += 0.02; // sweep rotation speed
                    
                    // Collision check beam with player
                    const beamLength = 800;
                    const bx = this.x + Math.cos(this.laserAngle) * beamLength;
                    const by = this.y + Math.sin(this.laserAngle) * beamLength;
                    
                    // Direct segment-to-circle collision check
                    const A = { x: this.x, y: this.y };
                    const B = { x: bx, y: by };
                    const C = { x: player.x, y: player.y };
                    
                    const distToBeam = this.distToSegment(C, A, B);
                    if (distToBeam < player.radius + 10) {
                        player.takeDamage(1.8); // DPS damage
                    }

                    if (this.laserTimer <= 0) {
                        this.state = 'chase';
                    }
                }
            }
        }

        // Collide with map obstacles
        const hit = gameMap.checkCollision(this.x, this.y, this.radius);
        if (hit.collided) {
            this.x += hit.pushX;
            this.y += hit.pushY;
        }

        // Push away from other enemies to avoid clustering
        if (window.enemiesList) {
            window.enemiesList.forEach(other => {
                if (other === this) return;
                const odx = other.x - this.x;
                const ody = other.y - this.y;
                const odist = Math.sqrt(odx * odx + ody * ody);
                const minDist = this.radius + other.radius + 4;
                if (odist < minDist) {
                    const overlap = minDist - odist;
                    const angle = Math.atan2(ody, odx);
                    this.x -= Math.cos(angle) * overlap * 0.5;
                    this.y -= Math.sin(angle) * overlap * 0.5;
                }
            });
        }
    }

    doPatrol() {
        this.patrolTimer--;
        if (this.patrolTimer <= 0) {
            // Pick a random spot close to spawn
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 80 + 30;
            this.patrolTarget.x = this.spawnX + Math.cos(angle) * dist;
            this.patrolTarget.y = this.spawnY + Math.sin(angle) * dist;
            
            // Keep patrol targets in bounds
            this.patrolTarget.x = Math.max(80, Math.min(gameMap.width - 80, this.patrolTarget.x));
            this.patrolTarget.y = Math.max(80, Math.min(gameMap.height - 80, this.patrolTarget.y));
            
            this.patrolTimer = Math.random() * 120 + 120; // 2s to 4s
        }

        const pdx = this.patrolTarget.x - this.x;
        const pdy = this.patrolTarget.y - this.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

        if (pdist > 5) {
            this.facingAngle = Math.atan2(pdy, pdx);
            this.x += Math.cos(this.facingAngle) * this.speed * 0.6;
            this.y += Math.sin(this.facingAngle) * this.speed * 0.6;
        }
    }

    shootOrb(player) {
        audio.playSFX(800, 400, 'triangle', 0.25, 0.4);
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        
        // Spawn void projectile in global manager
        const speed = 4.2;
        window.voidProjectiles.push({
            x: this.x + Math.cos(angle) * 16,
            y: this.y + Math.sin(angle) * 16,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 7,
            damage: this.damage,
            color: '#b5179e',
            life: 90
        });
    }

    spawnBossProjectile(x, y, angle, speed) {
        window.voidProjectiles.push({
            x: x + Math.cos(angle) * 35,
            y: y + Math.sin(angle) * 35,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 8,
            damage: this.damage,
            color: '#7b2cbf',
            life: 140
        });
    }

    // Helper math segment distance function
    distToSegment(p, v, w) {
        const l2 = (v.x - w.x)*(v.x - w.x) + (v.y - w.y)*(v.y - w.y);
        if (l2 === 0) return Math.sqrt((p.x - v.x)*(p.x - v.x) + (p.y - v.y)*(p.y - v.y));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = v.x + t * (w.x - v.x);
        const py = v.y + t * (w.y - v.y);
        return Math.sqrt((p.x - px)*(p.x - px) + (p.y - py)*(p.y - py));
    }

    draw(ctx, camera) {
        const ex = this.x - camera.x;
        const ey = this.y - camera.y;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ex, ey + this.radius - 2, this.radius, this.radius/2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. Draw warning indicators / active laser beams for Boss
        if (this.type === 'boss') {
            if (this.laserIndicatorActive) {
                // Red warning beam line indicator
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 0, 84, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([8, 4]);
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex + Math.cos(this.laserAngle) * 800, ey + Math.sin(this.laserAngle) * 800);
                ctx.stroke();
                ctx.restore();
            }

            if (this.state === 'laser_sweep') {
                // Giant void beam sweep drawing
                ctx.save();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 14;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ff0054';
                
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex + Math.cos(this.laserAngle) * 800, ey + Math.sin(this.laserAngle) * 800);
                ctx.stroke();
                
                ctx.strokeStyle = '#9d4edd';
                ctx.lineWidth = 26;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex + Math.cos(this.laserAngle) * 800, ey + Math.sin(this.laserAngle) * 800);
                ctx.stroke();
                
                ctx.restore();
            }
        }

        // 2. Draw Enemy Body
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(this.facingAngle);

        if (this.flashTicks > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        if (this.type === 'crawler') {
            // Bug/crawler shape
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Glowing spikes
            ctx.fillStyle = '#ff0054';
            ctx.fillRect(-this.radius - 2, -4, 4, 8);
            
            // Fangs
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.radius - 2, -6);
            ctx.lineTo(this.radius + 6, -3);
            ctx.moveTo(this.radius - 2, 6);
            ctx.lineTo(this.radius + 6, 3);
            ctx.stroke();
        } 
        
        else if (this.type === 'sentry') {
            // Hovering eye construct
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.quadraticCurveTo(0, -this.radius - 3, this.radius, 0);
            ctx.quadraticCurveTo(0, this.radius + 3, -this.radius, 0);
            ctx.fill();
            
            // Outer armor ring
            ctx.strokeStyle = '#3c096c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 2, 0, Math.PI*2);
            ctx.stroke();

            // Inner glowing iris eye center
            ctx.fillStyle = '#00f5d4';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f5d4';
            ctx.beginPath();
            ctx.arc(4, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } 
        
        else if (this.type === 'boss') {
            // Massive Void guardian golem construct
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Golem shoulder pauldrons
            ctx.fillStyle = '#220044';
            ctx.strokeStyle = '#9d4edd';
            ctx.lineWidth = 3;
            ctx.fillRect(-this.radius + 5, -this.radius - 8, 20, 20);
            ctx.strokeRect(-this.radius + 5, -this.radius - 8, 20, 20);
            ctx.fillRect(-this.radius + 5, this.radius - 12, 20, 20);
            ctx.strokeRect(-this.radius + 5, this.radius - 12, 20, 20);

            // Glowing void core heart
            ctx.fillStyle = '#ff0054';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0054';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Stone head horn crowns
            ctx.fillStyle = '#10002b';
            ctx.beginPath();
            ctx.moveTo(this.radius - 5, -12);
            ctx.lineTo(this.radius + 15, -20);
            ctx.lineTo(this.radius + 5, 0);
            ctx.lineTo(this.radius + 15, 20);
            ctx.lineTo(this.radius - 5, 12);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// Global lists managers
window.enemiesList = [];
window.voidProjectiles = [];

function spawnLevelEnemies(lvlId) {
    window.enemiesList = [];
    window.voidProjectiles = [];
    
    const lvl = gameMap.levels[lvlId];
    lvl.enemies.forEach(e => {
        window.enemiesList.push(new Enemy(e.x, e.y, e.type));
    });
}
window.spawnLevelEnemies = spawnLevelEnemies;
