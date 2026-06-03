class Particle {
    constructor(x, y, vx, vy, size, color, life, decay, type = 'physics') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.life = life; // Starting opacity/life (1.0 to 0.0)
        this.decay = decay; // Decaying rate per frame
        this.type = type; // 'physics' (moves and gravity) or 'static' (fades in place) or 'ghost' (player trail)
        this.gravity = type === 'physics' ? 0.05 : 0;
        this.angle = Math.random() * Math.PI * 2;
        this.angularSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.angle += this.angularSpeed;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);

        if (this.type === 'ghost') {
            // Player visual shadow trail
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 245, 212, 0.4)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f5d4';
            ctx.fill();
        } else if (this.type === 'ember') {
            // Torch flames
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fill();
        } else {
            // Standard sparks or dust
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.list = [];
    }

    update() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].update();
            if (this.list[i].life <= 0) {
                this.list.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.list.forEach(p => p.draw(ctx));
    }

    clear() {
        this.list = [];
    }

    spawnDust(x, y) {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 0.8;
            const vy = -Math.random() * 0.4;
            const size = Math.random() * 4 + 2;
            const decay = Math.random() * 0.02 + 0.02;
            this.list.push(new Particle(x, y, vx, vy, size, '#4a4256', 0.6, decay, 'physics'));
        }
    }

    spawnDashTrail(x, y, size) {
        // Player copy shadow ghost
        this.list.push(new Particle(x, y, 0, 0, size, '', 0.5, 0.04, 'ghost'));
    }

    spawnHitSparks(x, y, color = '#ff0054') {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 1; // slightly upward bias
            const size = Math.random() * 3 + 2;
            const decay = Math.random() * 0.03 + 0.02;
            this.list.push(new Particle(x, y, vx, vy, size, color, 1.0, decay, 'physics'));
        }
    }

    spawnSpellExplosion(x, y) {
        const count = 25;
        const colors = ['#00f5d4', '#00b4d8', '#9d4edd', '#ffffff'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1.5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = Math.random() * 5 + 3;
            const decay = Math.random() * 0.02 + 0.015;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.list.push(new Particle(x, y, vx, vy, size, color, 1.0, decay, 'physics'));
        }
    }

    spawnEmber(x, y, color = '#ff6b35') {
        // Light floating torch flames
        if (Math.random() > 0.15) return;
        const vx = (Math.random() - 0.5) * 0.3;
        const vy = -Math.random() * 0.5 - 0.3;
        const size = Math.random() * 3 + 2;
        const decay = Math.random() * 0.015 + 0.01;
        this.list.push(new Particle(x, y, vx, vy, size, color, 1.0, decay, 'ember'));
    }

    spawnPortalVortex(x, y, radius) {
        if (Math.random() > 0.3) return;
        const angle = Math.random() * Math.PI * 2;
        const vx = -Math.cos(angle) * 1.5;
        const vy = -Math.sin(angle) * 1.5;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        const decay = Math.random() * 0.03 + 0.02;
        this.list.push(new Particle(px, py, vx, vy, 3, '#9d4edd', 0.8, decay, 'ember'));
    }
}

// Global Particle Engine Instance
const particles = new ParticleSystem();
