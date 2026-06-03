class AudioEngine {
    constructor() {
        this.ctx = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.musicInterval = null;
        this.isPlayingMusic = false;
        this.melodyNoteIndex = 0;
        
        // Simple pentatonic scales for background music
        this.musicScale = [110.00, 123.47, 130.81, 146.83, 164.81, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00];
        // Epic bass progression
        this.bassProgression = [
            [110.00, 110.00, 110.00, 110.00], // A
            [82.41, 82.41, 82.41, 82.41],    // E
            [97.99, 97.99, 97.99, 97.99],    // G
            [87.31, 87.31, 87.31, 87.31]     // F
        ];
        this.currentChordIndex = 0;
        this.currentStep = 0;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playSFX(freqStart, freqEnd, type, duration, volumeMult = 1.0) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(this.sfxVolume * volumeMult, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoiseSFX(duration, bandpassFreq, bandpassQ, volumeMult = 1.0) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(bandpassFreq, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);
        filter.Q.setValueAtTime(bandpassQ, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.sfxVolume * volumeMult, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
    }

    playSword() {
        // High frequency swish noise
        this.playNoiseSFX(0.15, 3000, 3, 0.4);
        // Quick high frequency triangle sweep
        this.playSFX(600, 1500, 'triangle', 0.12, 0.3);
    }

    playDash() {
        // Soft wind noise
        this.playNoiseSFX(0.2, 800, 1, 0.5);
    }

    playBlast() {
        // Aether magical energy blast
        this.playSFX(1200, 150, 'sine', 0.3, 0.4);
        this.playSFX(300, 80, 'sawtooth', 0.25, 0.2);
    }

    playHit() {
        // High intensity impact spark
        this.playSFX(180, 50, 'triangle', 0.08, 0.6);
        this.playNoiseSFX(0.08, 1200, 5, 0.4);
    }

    playPlayerHit() {
        // Distinct distress chime
        this.playSFX(330, 110, 'sawtooth', 0.2, 0.5);
    }

    playHeal() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord arpeggio
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playSFX(freq, freq * 1.5, 'sine', 0.2, 0.4);
            }, index * 80);
        });
    }

    playQuest() {
        if (!this.ctx) return;
        this.playSFX(440, 880, 'sine', 0.1, 0.4);
        setTimeout(() => this.playSFX(880, 1320, 'sine', 0.2, 0.4), 100);
    }

    playDoorOpen() {
        this.playSFX(150, 50, 'triangle', 0.5, 0.3);
        this.playNoiseSFX(0.4, 200, 1, 0.3);
    }

    playBossDeath() {
        this.playSFX(150, 30, 'sawtooth', 1.5, 0.8);
        this.playNoiseSFX(1.5, 100, 0.5, 0.8);
    }

    playWin() {
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // Victory fanfare
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playSFX(freq, freq, 'triangle', 0.4, 0.4);
            }, idx * 120);
        });
    }

    playLose() {
        if (!this.ctx) return;
        const notes = [311.13, 293.66, 261.63, 196.00]; // Defeat notes
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playSFX(freq, freq * 0.8, 'sawtooth', 0.5, 0.5);
            }, idx * 150);
        });
    }

    // Interactive atmospheric soundtrack loop generator
    startMusic() {
        this.init();
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        
        let step = 0;
        this.musicInterval = setInterval(() => {
            if (!this.ctx || this.ctx.state === 'suspended') return;
            
            // Bass trigger (every 4 steps, i.e., beat 1 of each bar)
            if (step % 4 === 0) {
                const chordProg = this.bassProgression[this.currentChordIndex];
                const bassNote = chordProg[Math.floor(step / 4) % chordProg.length];
                
                const oscBass = this.ctx.createOscillator();
                const gainBass = this.ctx.createGain();
                
                oscBass.type = 'sawtooth';
                oscBass.frequency.setValueAtTime(bassNote / 2, this.ctx.currentTime); // Sub-bass octave
                
                gainBass.gain.setValueAtTime(this.musicVolume * 0.4, this.ctx.currentTime);
                gainBass.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
                
                // Add a lowpass filter to make the bass feel deep and dark
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(180, this.ctx.currentTime);
                
                oscBass.connect(filter);
                filter.connect(gainBass);
                gainBass.connect(this.ctx.destination);
                
                oscBass.start();
                oscBass.stop(this.ctx.currentTime + 1.25);
            }
            
            // Melody trigger (on specific steps)
            if (step % 2 === 0 || Math.random() > 0.5) {
                const chordNotes = this.bassProgression[this.currentChordIndex];
                const baseFreq = chordNotes[0];
                
                // Pick a note from the scale that sounds harmonious
                const offset = this.musicScale[Math.floor(Math.random() * this.musicScale.length)];
                const freq = baseFreq * (offset / 110);
                
                const oscMelody = this.ctx.createOscillator();
                const gainMelody = this.ctx.createGain();
                
                oscMelody.type = 'sine';
                oscMelody.frequency.setValueAtTime(freq, this.ctx.currentTime);
                
                gainMelody.gain.setValueAtTime(this.musicVolume * 0.15, this.ctx.currentTime);
                gainMelody.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
                
                oscMelody.connect(gainMelody);
                gainMelody.connect(this.ctx.destination);
                
                oscMelody.start();
                oscMelody.stop(this.ctx.currentTime + 0.5);
            }

            step++;
            if (step >= 16) {
                step = 0;
                this.currentChordIndex = (this.currentChordIndex + 1) % this.bassProgression.length;
            }
        }, 320); // 320ms per step (~94 BPM)
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.isPlayingMusic = false;
    }

    updateVolume(type, value) {
        const val = value / 100;
        if (type === 'music') {
            this.musicVolume = val;
        } else if (type === 'sfx') {
            this.sfxVolume = val;
        }
    }
}

// Global Audio Engine Instance
const audio = new AudioEngine();
