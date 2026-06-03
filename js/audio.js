class AudioEngine {
    constructor() {
        this.ctx = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.musicInterval = null;
        this.isPlayingMusic = false;
        
        // Decoded buffer storage
        this.buffers = {};
        this.bgmBuffer = null;
        this.bgmSource = null;
        this.bgmGain = null;
        
        // Target paths for local audio assets
        this.sfxFiles = {
            sword: 'assets/audio/sword.wav',
            dash: 'assets/audio/dash.wav',
            spell: 'assets/audio/spell.wav',
            hit: 'assets/audio/hit.wav',
            player_hit: 'assets/audio/player_hit.wav',
            heal: 'assets/audio/heal.wav',
            quest: 'assets/audio/quest.wav',
            door: 'assets/audio/door.wav',
            boss_death: 'assets/audio/boss_death.wav',
            win: 'assets/audio/win.wav',
            lose: 'assets/audio/lose.wav'
        };
        this.bgmFile = 'assets/audio/bgm.mp3';

        // Simple pentatonic scales for background music fallback
        this.musicScale = [110.00, 123.47, 130.81, 146.83, 164.81, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00];
        this.bassProgression = [
            [110.00, 110.00, 110.00, 110.00], // A
            [82.41, 82.41, 82.41, 82.41],    // E
            [97.99, 97.99, 97.99, 97.99],    // G
            [87.31, 87.31, 87.31, 87.31]     // F
        ];
        this.currentChordIndex = 0;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.loadAudioFiles();
    }

    async loadAudioFiles() {
        // Load sfx WAV files
        for (const [key, path] of Object.entries(this.sfxFiles)) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
                        this.buffers[key] = decodedBuffer;
                    });
                }
            } catch (e) {
                // Fail silently, falls back to procedurally synthesized audio
            }
        }

        // Load bgm MP3 file
        try {
            const response = await fetch(this.bgmFile);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
                    this.bgmBuffer = decodedBuffer;
                    // Auto-start music if player clicked Start but BGM wasn't loaded yet
                    if (this.isPlayingMusic && !this.bgmSource) {
                        this.startMusic();
                    }
                });
            }
        } catch (e) {
            // Fail silently
        }
    }

    playFileSFX(name) {
        if (this.ctx && this.buffers[name]) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            const source = this.ctx.createBufferSource();
            source.buffer = this.buffers[name];
            
            const gainNode = this.ctx.createGain();
            gainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            
            source.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            source.start(0);
            return true;
        }
        return false;
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
        if (this.playFileSFX('sword')) return;
        this.playNoiseSFX(0.15, 3000, 3, 0.4);
        this.playSFX(600, 1500, 'triangle', 0.12, 0.3);
    }

    playDash() {
        if (this.playFileSFX('dash')) return;
        this.playNoiseSFX(0.2, 800, 1, 0.5);
    }

    playBlast() {
        if (this.playFileSFX('spell')) return;
        this.playSFX(1200, 150, 'sine', 0.3, 0.4);
        this.playSFX(300, 80, 'sawtooth', 0.25, 0.2);
    }

    playHit() {
        if (this.playFileSFX('hit')) return;
        this.playSFX(180, 50, 'triangle', 0.08, 0.6);
        this.playNoiseSFX(0.08, 1200, 5, 0.4);
    }

    playPlayerHit() {
        if (this.playFileSFX('player_hit')) return;
        this.playSFX(330, 110, 'sawtooth', 0.2, 0.5);
    }

    playHeal() {
        if (this.playFileSFX('heal')) return;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playSFX(freq, freq * 1.5, 'sine', 0.2, 0.4);
            }, index * 80);
        });
    }

    playQuest() {
        if (this.playFileSFX('quest')) return;
        this.playSFX(440, 880, 'sine', 0.1, 0.4);
        setTimeout(() => this.playSFX(880, 1320, 'sine', 0.2, 0.4), 100);
    }

    playDoorOpen() {
        if (this.playFileSFX('door')) return;
        this.playSFX(150, 50, 'triangle', 0.5, 0.3);
        this.playNoiseSFX(0.4, 200, 1, 0.3);
    }

    playBossDeath() {
        if (this.playFileSFX('boss_death')) return;
        this.playSFX(150, 30, 'sawtooth', 1.5, 0.8);
        this.playNoiseSFX(1.5, 100, 0.5, 0.8);
    }

    playWin() {
        if (this.playFileSFX('win')) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playSFX(freq, freq, 'triangle', 0.4, 0.4);
            }, idx * 120);
        });
    }

    playLose() {
        if (this.playFileSFX('lose')) return;
        const notes = [311.13, 293.66, 261.63, 196.00];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playSFX(freq, freq * 0.8, 'sawtooth', 0.5, 0.5);
            }, idx * 150);
        });
    }

    startMusic() {
        this.init();
        if (this.isPlayingMusic && this.bgmSource) return;
        
        this.isPlayingMusic = true;

        if (this.bgmBuffer) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            // If already playing, stop first
            this.stopBgm();

            this.bgmSource = this.ctx.createBufferSource();
            this.bgmSource.buffer = this.bgmBuffer;
            this.bgmSource.loop = true;
            
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            
            this.bgmSource.connect(this.bgmGain);
            this.bgmGain.connect(this.ctx.destination);
            this.bgmSource.start(0);
            return;
        }

        // Procedural music loop fallback
        if (this.musicInterval) return;
        let step = 0;
        this.musicInterval = setInterval(() => {
            if (!this.ctx || this.ctx.state === 'suspended') return;
            
            if (step % 4 === 0) {
                const chordProg = this.bassProgression[this.currentChordIndex];
                const bassNote = chordProg[Math.floor(step / 4) % chordProg.length];
                
                const oscBass = this.ctx.createOscillator();
                const gainBass = this.ctx.createGain();
                
                oscBass.type = 'sawtooth';
                oscBass.frequency.setValueAtTime(bassNote / 2, this.ctx.currentTime);
                
                gainBass.gain.setValueAtTime(this.musicVolume * 0.4, this.ctx.currentTime);
                gainBass.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
                
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(180, this.ctx.currentTime);
                
                oscBass.connect(filter);
                filter.connect(gainBass);
                gainBass.connect(this.ctx.destination);
                
                oscBass.start();
                oscBass.stop(this.ctx.currentTime + 1.25);
            }
            
            if (step % 2 === 0 || Math.random() > 0.5) {
                const chordNotes = this.bassProgression[this.currentChordIndex];
                const baseFreq = chordNotes[0];
                
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
        }, 320);
    }

    stopBgm() {
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
            } catch (e) {}
            this.bgmSource = null;
        }
    }

    stopMusic() {
        this.stopBgm();
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
            if (this.bgmGain) {
                this.bgmGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            }
        } else if (type === 'sfx') {
            this.sfxVolume = val;
        }
    }
}

const audio = new AudioEngine();
