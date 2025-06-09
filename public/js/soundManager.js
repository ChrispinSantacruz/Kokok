export class SoundManager {
    constructor() {
        this.sounds = {}
        this.soundPools = {} // Pool de sonidos para efectos críticos
        this.currentMusic = null
        this.musicVolume = 0.24
        this.effectsVolume = 0.5
        this.hoverVolume = 0.2
        this.clickVolume = 0.3
        this.isMuted = false
        this.init()
    }

    init() {
        // Crear todos los objetos de audio
        this.sounds = {
            // Música de fondo
            menu: this.createAudio('sounds/menu.mp3', this.musicVolume, true),
            jugar: this.createAudio('sounds/Jugar.mp3', this.musicVolume, true),
            
            // Efectos de combate
            bomba: this.createAudio('sounds/Bomba.mp3', this.effectsVolume),
            rocket: this.createAudio('sounds/Rocket.mp3', this.effectsVolume),
            explosion: this.createAudio('sounds/Explosion.mp3', this.effectsVolume),
            
            // Efectos de daño
            dañoVillano: this.createAudio('sounds/DañoVillano.mp3', this.effectsVolume),
            daño: this.createAudio('sounds/Daño.mp3', this.effectsVolume),
            
            // Efectos de juego
            gameover: this.createAudio('sounds/Gameover.mp3', this.effectsVolume),
            powerup: this.createAudio('sounds/Powerup.mp3', this.effectsVolume),
            
            // Efectos de UI (vamos a crear sonidos sintéticos simples)
            hover: this.createSyntheticSound('hover'),
            click: this.createSyntheticSound('click')
        }

        // Crear pools de sonidos para efectos críticos (eliminar latencia)
        this.createSoundPools()
        this.setupButtonSounds()
    }

    createSoundPools() {
        // Crear múltiples instancias de sonidos críticos
        const criticalSounds = ['dañoVillano', 'daño', 'explosion']
        
        criticalSounds.forEach(soundName => {
            this.soundPools[soundName] = []
            const originalSound = this.sounds[soundName]
            
            // Crear 3 copias de cada sonido crítico
            for (let i = 0; i < 3; i++) {
                if (originalSound && originalSound.src) {
                    const pooledSound = this.createAudio(originalSound.src, originalSound.volume)
                    this.soundPools[soundName].push(pooledSound)
                }
            }
        })
    }

    // Reproducir sonido desde el pool (sin latencia)
    playFromPool(soundName) {
        if (this.isMuted || !this.soundPools[soundName]) {
            return this.playSound(soundName) // Fallback al método normal
        }
        
        // Encontrar una instancia disponible del pool
        const availableSound = this.soundPools[soundName].find(sound => 
            sound.paused || sound.ended || sound.currentTime === 0
        )
        
        if (availableSound) {
            availableSound.currentTime = 0
            availableSound.play().catch(e => console.warn(`Error playing pooled sound ${soundName}:`, e))
        } else {
            // Si todas están ocupadas, usar la primera (reemplazar)
            const firstSound = this.soundPools[soundName][0]
            firstSound.currentTime = 0
            firstSound.play().catch(e => console.warn(`Error playing pooled sound ${soundName}:`, e))
        }
    }

    createAudio(src, volume, loop = false) {
        const audio = new Audio(src)
        audio.volume = volume
        audio.loop = loop
        audio.preload = 'auto'
        
        // Manejar errores de carga
        audio.addEventListener('error', (e) => {
            console.warn(`Error loading sound: ${src}`, e)
        })

        return audio
    }

    createSyntheticSound(type) {
        // Crear sonidos sintéticos simples usando Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        if (type === 'hover') {
            return this.createToneSound(audioContext, 800, 0.1, 0.1)
        } else if (type === 'click') {
            return this.createToneSound(audioContext, 1000, 0.15, 0.2)
        }
    }

    createToneSound(audioContext, frequency, duration, volume) {
        return {
            play: () => {
                if (this.isMuted) return
                
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
                oscillator.type = 'sine'
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime)
                gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
                
                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + duration)
            }
        }
    }

    setupButtonSounds() {
        // Agregar sonidos a todos los botones del juego
        const buttons = document.querySelectorAll('button, .menu-btn, .play-btn, .share-btn, .login-btn')
        
        buttons.forEach(button => {
            // Evitar agregar listeners múltiples
            if (!button.hasAttribute('data-sound-setup')) {
                // Sonido de hover
                button.addEventListener('mouseenter', () => {
                    this.playHover()
                })
                
                // Sonido de click
                button.addEventListener('click', () => {
                    this.playClick()
                })
                
                button.setAttribute('data-sound-setup', 'true')
            }
        })
    }

    // Método público para configurar botones dinámicos
    setupDynamicButton(button) {
        if (!button.hasAttribute('data-sound-setup')) {
            button.addEventListener('mouseenter', () => {
                this.playHover()
            })
            
            button.addEventListener('click', () => {
                this.playClick()
            })
            
            button.setAttribute('data-sound-setup', 'true')
        }
    }

    // Método para reconfigurar todos los botones (útil cuando se cambian pantallas)
    refreshButtonSounds() {
        this.setupButtonSounds()
    }

    // Métodos para reproducir música de fondo
    playMenuMusic() {
        this.stopCurrentMusic()
        if (!this.isMuted && this.sounds.menu) {
            this.currentMusic = this.sounds.menu
            this.sounds.menu.currentTime = 0
            this.sounds.menu.play().catch(e => console.warn('Error playing menu music:', e))
        }
    }

    playGameMusic() {
        this.stopCurrentMusic()
        if (!this.isMuted && this.sounds.jugar) {
            this.currentMusic = this.sounds.jugar
            this.sounds.jugar.currentTime = 0
            this.sounds.jugar.play().catch(e => console.warn('Error playing game music:', e))
        }
    }

    stopCurrentMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause()
            this.currentMusic.currentTime = 0
            this.currentMusic = null
        }
    }

    // Métodos para efectos de sonido
    playBomba() {
        this.playSound('bomba')
    }

    stopBomba() {
        this.stopSound('bomba')
    }

    playRocket() {
        this.playSound('rocket')
    }

    stopRocket() {
        this.stopSound('rocket')
    }

    playExplosion() {
        this.playFromPool('explosion')
    }

    playDañoVillano() {
        this.playFromPool('dañoVillano')
    }

    playDaño() {
        this.playFromPool('daño')
    }

    playGameover() {
        // Detener TODA la música y efectos de sonido inmediatamente
        this.stopAllSounds()
        
        // Reproducir sonido de game over inmediatamente
        this.playSound('gameover')
    }

    playPowerup() {
        this.playSound('powerup')
    }

    // Método para detener todos los sonidos
    stopAllSounds() {
        // Detener música actual
        this.stopCurrentMusic()
        
        // Detener todos los efectos de sonido
        Object.keys(this.sounds).forEach(key => {
            if (key !== 'hover' && key !== 'click' && this.sounds[key] && this.sounds[key].pause) {
                this.sounds[key].pause()
                this.sounds[key].currentTime = 0
            }
        })
    }

    playHover() {
        if (this.sounds.hover) {
            this.sounds.hover.play()
        }
    }

    playClick() {
        if (this.sounds.click) {
            this.sounds.click.play()
        }
    }

    // Métodos auxiliares
    playSound(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return
        
        const sound = this.sounds[soundName]
        
        // Para efectos de sonido (no música), crear nueva instancia si está ocupado
        if (soundName !== 'menu' && soundName !== 'jugar' && sound.src) {
            if (!sound.paused && sound.currentTime > 0) {
                // Si el sonido está reproduciéndose, crear una nueva instancia
                const newSound = this.createAudio(sound.src, sound.volume, false)
                newSound.play().catch(e => console.warn(`Error playing sound ${soundName}:`, e))
                return
            }
        }
        
        // Reproducir sonido normal
        sound.currentTime = 0
        sound.play().catch(e => console.warn(`Error playing sound ${soundName}:`, e))
    }

    stopSound(soundName) {
        if (!this.sounds[soundName]) return
        
        const sound = this.sounds[soundName]
        sound.pause()
        sound.currentTime = 0
    }

    // Control de volumen
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume))
        if (this.sounds.menu) this.sounds.menu.volume = this.musicVolume
        if (this.sounds.jugar) this.sounds.jugar.volume = this.musicVolume
    }

    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume))
        Object.keys(this.sounds).forEach(key => {
            if (key !== 'menu' && key !== 'jugar' && key !== 'hover' && key !== 'click') {
                if (this.sounds[key] && this.sounds[key].volume !== undefined) {
                    this.sounds[key].volume = this.effectsVolume
                }
            }
        })
    }

    // Mutear/desmutear
    toggleMute() {
        this.isMuted = !this.isMuted
        if (this.isMuted) {
            this.stopCurrentMusic()
            Object.keys(this.sounds).forEach(key => {
                if (this.sounds[key] && this.sounds[key].pause) {
                    this.sounds[key].pause()
                }
            })
        }
        return this.isMuted
    }

    setMute(muted) {
        this.isMuted = muted
        if (muted) {
            this.stopCurrentMusic()
        }
    }

    // Precargar todos los sonidos
    preloadAll() {
        Object.keys(this.sounds).forEach(key => {
            if (this.sounds[key] && this.sounds[key].load) {
                this.sounds[key].load()
            }
        })
    }
} 