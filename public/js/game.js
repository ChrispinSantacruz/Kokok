import { Player } from "./player.js"
import { TrumpBoss, ElonBoss, FinalBoss } from "./bosses.js"
import { Bullet, Bomb, Rocket } from "./projectiles.js"
import { PowerUpManager } from "./powerups.js"
import { GameState } from "./gameState.js"
import { Controls } from "./controls.js"
import { Utils } from "./utils.js"
import { Vector2 } from "./utils.js"
import { TelegramIntegration } from "./telegramIntegration.js"
import { PlayerManager } from "./playerManager.js"
import { SoundManager } from "./soundManager.js"

export class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.gameState = new GameState()
    this.shootCooldown = 0
    this.shootCooldownTime = 300 // 300ms entre shots
    this.telegram = new TelegramIntegration()
    this.playerManager = new PlayerManager()
    this.soundManager = new SoundManager()
    this.hasSharedCurrentGame = false // Control para avoid multiple shared by game

    // Precargar imágenes de fondo
    this.backgrounds = {
      trump: new Image(),
      elon: new Image()
    }
    this.backgrounds.trump.src = 'assents/KOKOK_GAME_GFX_acc-01.png'
    this.backgrounds.elon.src = 'assents/KOKOK_GAME_GFX_acc-02.png'

    this.setupCanvas()
    this.init()
    this.setupEventListeners()
    this.telegram.init()
    
    // Configurar sonidos de botones después de un breve delay
    setTimeout(() => {
      this.soundManager.refreshButtonSounds()
    }, 500)
    
    // Iniciar música del menú al cargar el juego
    setTimeout(() => {
      this.soundManager.playMenuMusic()
    }, 1000)
  }

  setupCanvas() {
    const maxWidth = Math.min(800, window.innerWidth - 40)
    const maxHeight = Math.min(600, window.innerHeight - 40)

    this.canvas.width = maxWidth
    this.canvas.height = maxHeight

    // Ajustar canvas en dispositivos móviles
    if (window.innerWidth < 768) {
      this.canvas.width = window.innerWidth - 20
      this.canvas.height = window.innerHeight - 100
    }
  }

  init() {
    this.player = new Player(this.canvas)
    this.controls = new Controls(this.canvas, this.player, this)
    this.powerUpManager = new PowerUpManager()
    this.bullets = []
    this.enemyProjectiles = []
    this.bosses = []
    this.particles = []
    this.lastTime = 0
    this.animationId = null
    this.lastBoss = null
  }

  setupEventListeners() {
    // Botones del menú principal
    document.getElementById("playBtn").addEventListener("click", () => {
      this.startGame()
    })

    document.getElementById("instructionsBtn").addEventListener("click", () => {
      this.playerManager.hideAllScreens()
      document.getElementById("instructionsScreen").classList.remove("hidden")
    })

    document.getElementById("backBtn").addEventListener("click", () => {
      this.playerManager.showMainMenu()
    })

    // Botones de game over
    document.getElementById("restartBtn").addEventListener("click", () => {
      this.startGame()
    })

    document.getElementById("shareTwitterBtn").addEventListener("click", () => {
      this.gameState.shareOnTwitter()
    })

    // Nuevo botón de compartir en Telegram (manual)
    document.getElementById("shareTelegramScoreBtn").addEventListener("click", () => {
      this.shareScoreInTelegram()
    })

    document.getElementById("backToMenuBtn").addEventListener("click", () => {
      this.showMainMenu()
    })

    // Controles de teclado
    window.addEventListener("keydown", (e) => {
      if (!this.gameState.gameRunning) return
      if (!e.repeat) {
        switch (e.code) {
          case "Space":
            e.preventDefault()
            this.addBullet()
            break
          case "ArrowUp":
            e.preventDefault()
            this.player.jump()
            break
        }
      }
    })

    window.addEventListener("resize", () => {
      this.setupCanvas()
    })

    // Mostrar controles móviles solo en landscape móvil
    const handleMobileControls = () => {
      const isLandscape = window.innerWidth < 1025 && window.innerWidth > window.innerHeight
      const isPortrait = window.innerWidth < 1025 && window.innerHeight > window.innerWidth
      const mobileControls = document.getElementById("mobileControls")
      
      if (mobileControls) {
        // Mostrar controles en landscape O portrait móvil/tablet
        if (isLandscape || isPortrait) {
          mobileControls.classList.remove("hidden")
        } else {
          mobileControls.classList.add("hidden")
        }
      }
    }
    window.addEventListener("resize", handleMobileControls)
    window.addEventListener("orientationchange", handleMobileControls)
    handleMobileControls()

    // Control de disparo móvil
    const shootBtn = document.getElementById("shootBtn")
    if (shootBtn) {
      shootBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.addBullet()
      })
    }

    // Control de sonido
    const soundToggleBtn = document.getElementById("soundToggleBtn")
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener("click", (e) => {
        e.preventDefault()
        const isMuted = this.soundManager.toggleMute()
        soundToggleBtn.textContent = isMuted ? "🔇" : "🔊"
        soundToggleBtn.classList.toggle("muted", isMuted)
      })
    }
  }

  startGame() {
    // Agregar clase al body para indicar que el juego está activo
    document.body.classList.add("game-active")
    
    // Cambiar a música de juego
    this.soundManager.playGameMusic()
    
    // Resetear flag de compartir para nueva partida
    this.hasSharedCurrentGame = false
    
    // Resetear completamente el botón de compartir para nueva partida
    const shareBtn = document.getElementById("shareTelegramScoreBtn")
    if (shareBtn) {
      shareBtn.disabled = false
      // Mantener solo la imagen, no agregar texto
      shareBtn.style.background = ''
    }
    
    // Iniciar timer de juego para n8n
    this.telegram.startGameTimer()
    
    this.gameState.start()
    this.bullets = []
    this.enemyProjectiles = []
    this.bosses = []
    this.particles = []
    this.powerUpManager.clear()
    this.gameState.currentBoss = null
    this.gameState.bossSpawned = false
    this.spawnBoss()
    this.gameLoop()
    
    const mobileControls = document.getElementById("mobileControls")
    if (mobileControls) {
      // Solo mostrar controles móviles si es móvil en landscape O portrait
      const isLandscape = window.innerWidth < 1025 && window.innerWidth > window.innerHeight
      const isPortrait = window.innerWidth < 1025 && window.innerHeight > window.innerWidth
      if (isLandscape || isPortrait) {
        mobileControls.classList.add("active")
        mobileControls.classList.remove("hidden")
      } else {
        mobileControls.classList.remove("active")
        mobileControls.classList.add("hidden")
      }
    }
  }

  showMainMenu() {
    // Quitar clase del body cuando se vuelve al menú
    document.body.classList.remove("game-active")
    
    // Volver a música de menú
    this.soundManager.playMenuMusic()
    
    document.getElementById("gameOverScreen").classList.add("hidden")
    document.getElementById("gameUI").classList.add("hidden")
    const mobileControls = document.getElementById("mobileControls")
    if (mobileControls) {
      mobileControls.classList.remove("active")
      mobileControls.classList.add("hidden")
    }
    
    this.playerManager.showMainMenu()
    
    // Refrescar sonidos de botones después de cambiar pantalla
    setTimeout(() => {
      this.soundManager.refreshButtonSounds()
    }, 100)
  }

  gameLoop(currentTime = 0) {
    if (!this.gameState.gameRunning) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.update(deltaTime)
    this.draw()

    this.animationId = requestAnimationFrame((time) => this.gameLoop(time))
  }

  update(deltaTime) {
    this.controls.update()
    this.player.update()
    this.powerUpManager.update(this.canvas)

    // Actualizar cooldown de disparo
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime
    }

    // Actualizar alerta de jefe
    this.gameState.updateBossAlert()

    // Actualizar balas del jugador
    this.bullets = this.bullets.filter((bullet) => {
      bullet.update(this.canvas)
      return bullet.active
    })

    // Actualizar proyectiles enemigos
    this.enemyProjectiles = this.enemyProjectiles.filter((projectile) => {
      projectile.update()
      return projectile.active
    })

    // Verificar si debe spawnar jefe (chequeo en cada frame)
    if (this.gameState.checkBossSpawn()) {
      this.spawnBoss()
    }

    // Actualizar jefes existentes
    this.bosses = this.bosses.filter((boss) => {
      boss.update()

      // Jefe dispara
      if (boss.type === "final") {
        const shootData = boss.getShootPositions()
        shootData.forEach((data) => {
          if (data.type === "bomb") {
            this.addBomb(data.pos.x, data.pos.y, data.isParabolic || false)
          } else if (data.type === "rocket") {
            this.addRocket(data.pos.x, data.pos.y)
          }
        })
      } else if (boss.shouldShoot()) {
        if (boss.type === "trump") {
          // Usar el nuevo método para múltiples bombas
          const shootData = boss.getShootPositions()
          shootData.forEach((data) => {
            this.addBomb(data.pos.x, data.pos.y, data.isParabolic || false)
          })
        } else if (boss.type === "elon") {
          // Usar el nuevo método para ataques híbridos
          const shootData = boss.getShootPositions()
          shootData.forEach((data) => {
            if (data.type === "bomb") {
              this.addBomb(data.pos.x, data.pos.y, data.isParabolic || false)
            } else if (data.type === "rocket") {
              this.addRocket(data.pos.x, data.pos.y)
            }
          })
        }
      }

      return boss.active
    })

    // Verificar colisiones
    this.checkCollisions()

    // Actualizar partículas
    this.updateParticles()

    // Verificar power-ups con mejor detección de colisión
    const powerUpCollected = this.powerUpManager.checkCollisions(this.player, this.gameState)
    if (powerUpCollected) {
      console.log(`Power-up collected: ${powerUpCollected}`)
      this.gameState.updatePowerUpStatus(powerUpCollected, true)

      // Crear efecto visual
      this.createExplosion(this.player.position.x, this.player.position.y - 20, false, ["#00FFFF", "#FFD700"])

      // Solo aplicar timeout para power-ups temporales (no vida)
      if (powerUpCollected !== "life") {
        setTimeout(
          () => {
            this.gameState.updatePowerUpStatus(powerUpCollected, false)
          },
          powerUpCollected === "shield" ? 10000 : 5000, // Escudo dura 10 segundos
        )
      }
    }
  }

  spawnBoss() {
    // Solo spawnar si no hay jefe activo
    if (this.gameState.currentBoss || this.bosses.length > 0) {
      return
    }
    
    let boss
    const bossCount = this.gameState.bossDefeated
    
    // Calcular multiplicador de velocidad (20% más rápido cada 6 jefes)
    const speedMultiplier = 1 + (Math.floor(bossCount / 6) * 0.2)
    
    if (bossCount < 6) {
      // Primeras 6 apariciones: ciclo inicial
      const bossPhase = bossCount % 6
      
      switch (bossPhase) {
        case 0: // Primera aparición: Trump - 1 bomba
          boss = new TrumpBoss(this.canvas)
          boss.health = 10
          boss.type = 'trump'
          boss.bombCount = 1
          boss.attackType = 'bomb'
          break
          
        case 1: // Primera aparición: Elon - solo cohetes
          boss = new ElonBoss(this.canvas)
          boss.health = 10
          boss.type = 'elon'
          boss.attackType = 'rocket'
          boss.canUseInvisibility = false
          break
          
        case 2: // Segunda aparición: Trump - 2 bombas
          boss = new TrumpBoss(this.canvas)
          boss.health = 10
          boss.type = 'trump'
          boss.bombCount = 2
          boss.attackType = 'bomb'
          break
          
        case 3: // Segunda aparición: Elon - cohete + bomba
          boss = new ElonBoss(this.canvas)
          boss.health = 10
          boss.type = 'elon'
          boss.attackType = 'hybrid'
          boss.canUseInvisibility = false
          break
          
        case 4: // Tercera aparición: Trump - 3 bombas
          boss = new TrumpBoss(this.canvas)
          boss.health = 10
          boss.type = 'trump'
          boss.bombCount = 3
          boss.attackType = 'bomb'
          break
          
        case 5: // Tercera aparición: Elon - solo cohete + invisibilidad
          boss = new ElonBoss(this.canvas)
          boss.health = 10
          boss.type = 'elon'
          boss.attackType = 'rocket'
          boss.canUseInvisibility = true
          break
      }
    } else {
      // Después de las primeras 6 apariciones: alternar entre las versiones más difíciles
      const isEvenBoss = (bossCount - 6) % 2 === 0
      
      if (isEvenBoss) {
        // Trump nivel 3 - 3 bombas parabólicas
        boss = new TrumpBoss(this.canvas)
        boss.health = 12 // Incrementar vida ligeramente
        boss.type = 'trump'
        boss.bombCount = 3
        boss.attackType = 'bomb'
      } else {
        // Elon nivel 3 - cohete + invisibilidad
        boss = new ElonBoss(this.canvas)
        boss.health = 12 // Incrementar vida ligeramente
        boss.type = 'elon'
        boss.attackType = 'rocket'
        boss.canUseInvisibility = true
      }
    }
    
    // Aplicar multiplicador de velocidad
    if (boss.type === 'trump') {
      boss.velocity.x *= speedMultiplier
      boss.baseSpeed *= speedMultiplier
    } else if (boss.type === 'elon') {
      // Para Elon, afectar la velocidad del movimiento sinusoidal
      boss.speedMultiplier = speedMultiplier
    }
    
    this.bosses.push(boss)
    this.gameState.currentBoss = boss
    this.gameState.bossSpawned = true
  }

  addBullet() {
    // Verificar cooldown
    if (this.shootCooldown > 0) return

    const playerPos = this.player.getPosition()
    const bullet = new Bullet(playerPos.x, playerPos.y - this.player.radius)
    // Hacer las balas más rápidas
    bullet.velocity.multiply(1.5)
    this.bullets.push(bullet)
    
    // Activar cooldown
    this.shootCooldown = this.shootCooldownTime
  }

  addBomb(x, y, isParabolic = false) {
    let targetX, targetY, bomb
    
    // Reproducir sonido de bomba cuando se lanza
    this.soundManager.playBomba()
    
    if (isParabolic) {
      // Trayectoria parabólica más amplia
      targetX = this.player.position.x + Utils.randomBetween(-100, 100)
      targetY = this.canvas.height - 75
      bomb = new Bomb(x, y, targetX, targetY, true) // true para parabólica
    } else {
      // Trayectoria normal
      targetX = this.player.position.x + Utils.randomBetween(-50, 50)
      targetY = this.canvas.height - 75
      bomb = new Bomb(x, y, targetX, targetY, false)
    }
    
    this.enemyProjectiles.push(bomb)
  }

  addRocket(x, y) {
    // Reproducir sonido de rocket cuando se lanza
    this.soundManager.playRocket()
    
    const rocket = new Rocket(x, y, this.player)
    this.enemyProjectiles.push(rocket)
  }

  checkCollisions() {
    // Balas del jugador vs jefes
    this.bullets.forEach((bullet) => {
      this.bosses.forEach((boss) => {
        let hit = false
        // Verificar colisión usando distancia
        const distance = Utils.getDistance(bullet.position, boss.position)
        if (distance < (boss.radius + bullet.radius)) {
          hit = true
          
          // REPRODUCIR SONIDO INMEDIATAMENTE al detectar colisión
          this.soundManager.playDañoVillano()
          
          boss.health--
          this.gameState.addScore(1)
          
          if (boss.health <= 0) {
            this.gameState.bossDead()
            this.createExplosion(boss.position.x, boss.position.y, true)
            this.bosses = []
            this.gameState.currentBoss = null
            this.gameState.bossSpawned = false
            
            // Spawnear power-up de vida después de derrotar jefe
            setTimeout(() => {
              this.powerUpManager.spawnLifePowerUp(this.canvas)
            }, 2000) // Aparece 2 segundos después
            
            setTimeout(() => this.spawnBoss(), 1000)
          }
        }
        if (hit) {
          bullet.destroy()
          this.createExplosion(bullet.position.x, bullet.position.y)
        }
      })

      // Verificar colisión de balas con cohetes
      this.enemyProjectiles.forEach((projectile) => {
        if (projectile instanceof Rocket && !projectile.exploded) {
          const distance = Utils.getDistance(bullet.position, projectile.position)
          if (distance < (projectile.radius + bullet.radius)) {
            if (projectile.takeDamage()) {
              // Sonido de explosión cuando se destruye un misil
              this.soundManager.playExplosion()
              // Detener sonido de rocket
              this.soundManager.stopRocket()
              this.createExplosion(projectile.position.x, projectile.position.y)
            }
            bullet.destroy()
            this.createExplosion(bullet.position.x, bullet.position.y)
          }
        }
      })
    })

    // Proyectiles enemigos vs jugador
    this.enemyProjectiles.forEach((projectile) => {
      const playerPos = this.player.getPosition()
      const distance = Utils.getDistance(projectile.position, playerPos)
      
      if (distance < (this.player.radius + projectile.radius)) {
        projectile.active = false
        
        // Detener sonido de bomba si es una bomba
        if (projectile instanceof Bomb) {
          this.soundManager.stopBomba()
        }
        
        // REPRODUCIR SONIDO DE DAÑO INMEDIATAMENTE antes de cualquier otra cosa
        this.soundManager.playDaño()
        
        if (this.player.takeDamage()) {
          this.gameState.loseLife()
          this.createExplosion(playerPos.x, playerPos.y)
          
          // Verificar si el juego debe terminar
          if (this.gameState.lives <= 0) {
            this.gameOver()
          }
        }
      }
    })

    // Verificar proyectiles que impactan en el suelo
    this.enemyProjectiles.forEach((projectile) => {
      if (projectile instanceof Bomb && projectile.position.y >= this.canvas.height - 75) {
        // Bomba explota en el suelo
        this.soundManager.stopBomba()
        this.soundManager.playExplosion()
        this.createExplosion(projectile.position.x, projectile.position.y)
        projectile.active = false
      }
    })

    // Jefes vs jugador (solo para el jefe final con cucaracha)
    this.bosses.forEach((boss) => {
      if (boss.type === "final" && boss.checkCollisionWithPlayer) {
        const playerPos = this.player.getPosition()
        const distance = Utils.getDistance(boss.position, playerPos)
        
        if (distance < (this.player.radius + boss.radius)) {
          // REPRODUCIR SONIDO DE DAÑO INMEDIATAMENTE antes de cualquier otra cosa
          this.soundManager.playDaño()
          
          if (this.player.takeDamage()) {
            this.gameState.loseLife()
            this.createExplosion(playerPos.x, playerPos.y)
            
            // Verificar si el juego debe terminar
            if (this.gameState.lives <= 0) {
              this.gameOver()
            }
          }
        }
      }
    })
  }

  createExplosion(x, y, isBig = false, customColors = null) {
    const particleCount = isBig ? 20 : 10
    const colors = customColors || ["#FF4500", "#FF6347", "#FFD700", "#FFA500"]

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: Utils.randomBetween(-8, 8),
        vy: Utils.randomBetween(-8, 8),
        life: isBig ? 60 : 30,
        maxLife: isBig ? 60 : 30,
        size: Utils.randomBetween(3, isBig ? 8 : 5),
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
  }

  updateParticles() {
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vx *= 0.98
      particle.vy *= 0.98
      particle.life--
      return particle.life > 0
    })
  }

  draw() {
    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Dibujar fondo
    this.drawBackground()

    // Dibujar objetos del juego
    this.player.draw(this.ctx)
    this.bullets.forEach((bullet) => bullet.draw(this.ctx))
    this.enemyProjectiles.forEach((projectile) => projectile.draw(this.ctx))
    this.bosses.forEach((boss) => boss.draw(this.ctx))
    this.powerUpManager.draw(this.ctx)

    // Dibujar partículas
    this.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife
      this.ctx.globalAlpha = alpha
      Utils.drawCircle(this.ctx, particle.x, particle.y, particle.size, particle.color)
      this.ctx.globalAlpha = 1
    })

    // Dibujar alerta de jefe (se dibuja encima de todo)
    this.gameState.drawBossAlert(this.ctx, this.canvas)
  }

  drawBackground() {
    // Verificar si hay un jefe actual para determinar el fondo
    let currentBossType = null
    if (this.gameState.currentBoss && this.gameState.currentBoss.type) {
      currentBossType = this.gameState.currentBoss.type
    }

    // No dibujar fondo durante la alerta de jefe
    if (this.gameState.showingBossIncoming) {
      return // No dibujar ningún fondo durante la alerta
    }

    // Si hay un jefe específico, usar su escenario
    if (currentBossType === 'trump') {
      // Fondo para Trump
      if (this.backgrounds.trump.complete) {
        this.ctx.drawImage(this.backgrounds.trump, 0, 0, this.canvas.width, this.canvas.height)
      }
      // No mostrar fondo genérico mientras carga
    } else if (currentBossType === 'elon') {
      // Fondo para Elon
      if (this.backgrounds.elon.complete) {
        this.ctx.drawImage(this.backgrounds.elon, 0, 0, this.canvas.width, this.canvas.height)
      }
      // No mostrar fondo genérico mientras carga
    } else {
      // Fondo por defecto cuando no hay jefe o en menú
      this.drawDefaultBackground()
    }
  }

  drawDefaultBackground() {
    // Gradiente de fondo original
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(0.5, "#98FB98")
    gradient.addColorStop(1, "#8FBC8F")
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Suelo
    this.ctx.fillStyle = "#D2B48C"
    this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50)

    // Nubes animadas
    const time = Date.now() * 0.001
    for (let i = 0; i < 4; i++) {
      const x = ((time * 30 + i * 150) % (this.canvas.width + 100)) - 50
      const y = 40 + i * 25

      this.ctx.globalAlpha = 0.4
      Utils.drawCircle(this.ctx, x, y, 25, "white")
      Utils.drawCircle(this.ctx, x + 20, y, 30, "white")
      Utils.drawCircle(this.ctx, x + 40, y, 25, "white")
      this.ctx.globalAlpha = 1
    }

    // Árboles de fondo
    for (let i = 0; i < 8; i++) {
      const x = i * 100 + 50
      const y = this.canvas.height - 100
      this.ctx.fillStyle = "#228B22"
      this.ctx.font = "40px Arial"
      this.ctx.textAlign = "center"
      this.ctx.fillText("��", x, y)
    }
  }

  gameOver() {
    console.log("Game.gameOver() called - stopping game loop and playing game over sound")
    
    this.gameState.gameRunning = false
    cancelAnimationFrame(this.animationId)
    
    // Detener TODA la música y efectos, luego reproducir solo game over
    this.soundManager.playGameover()
    
    // REMOVER compartir automático - ahora será manual
    // this.telegram.shareScore(this.gameState.score)
    
    document.getElementById("gameOverScreen").classList.remove("hidden")
    document.getElementById("gameUI").classList.add("hidden")
    document.getElementById("finalScore").textContent = this.gameState.score
    
    // Actualizar récord en pantalla usando gameState
    document.getElementById("bestScore").textContent = this.gameState.highScore
    
    // Resetear estado del botón de compartir
    const shareBtn = document.getElementById("shareTelegramScoreBtn")
    if (shareBtn) {
      shareBtn.disabled = false
      // Mantener solo la imagen, no agregar texto
      shareBtn.style.background = ''
    }
    
    // Ocultar controles móviles
    const mobileControls = document.getElementById("mobileControls")
    if (mobileControls) {
      mobileControls.classList.remove("active")
      mobileControls.classList.add("hidden")
    }
    
    // Refrescar sonidos de botones en pantalla de game over
    setTimeout(() => {
      this.soundManager.refreshButtonSounds()
    }, 100)
    
    // NO reproducir música de menú automáticamente después del game over
    // La música de menú solo se reproduce cuando el usuario vuelve al menú manualmente
  }

  // Nueva función para compartir puntuación manualmente
  async shareScoreInTelegram() {
    const shareBtn = document.getElementById("shareTelegramScoreBtn")
    const score = this.gameState.score
    
    // 🚫 NUEVA VALIDACIÓN: Prohibir compartir con 0 puntos
    if (score === 0) {
      shareBtn.style.background = 'linear-gradient(135deg, #8B4513, #A0522D)'
      shareBtn.disabled = true
      
      // Restaurar botón después de 3 segundos
      setTimeout(() => {
        shareBtn.style.background = ''
        shareBtn.disabled = false
      }, 3000)
      return
    }
    
    // Verificar si ya se compartió esta partida
    if (this.hasSharedCurrentGame) {
      shareBtn.disabled = true
      shareBtn.style.background = 'linear-gradient(135deg, #666, #888)'
      return
    }
    
    // Deshabilitar botón temporalmente
    shareBtn.disabled = true
    shareBtn.style.background = 'linear-gradient(135deg, #ff8c00, #ffa500)'
    
    try {
      const playerName = this.playerManager.getPlayerName()
      
      // Preparar datos para el webhook (simplificados)
      const webhookData = {
        chatId: this.telegram.chatId || '-1002291915890', // Chat ID por defecto si no hay uno específico
        playerName: playerName,
        score: score,
        event: 'manual_share',
        timestamp: new Date().toISOString(),
        gameSession: this.telegram.generateSessionId(),
        additionalData: {
          platform: this.telegram.getPlatform(),
          isManualShare: true
        }
      }
      
      console.log('🎯 Compartiendo puntuación manual:', webhookData)
      console.log('🔍 DEBUG DETALLADO:')
      console.log('- Chat ID original:', this.telegram.chatId)
      console.log('- Chat ID final:', webhookData.chatId)
      console.log('- URL actual:', window.location.href)
      console.log('- Parámetros URL:', window.location.search)
      
      // Enviar al webhook de n8n
      await this.telegram.sendToN8nWebhook(webhookData)
      
      // Mostrar mensaje de éxito
      shareBtn.style.background = 'linear-gradient(135deg, #00aa00, #00dd00)'
      
      // Marcar como compartido
      this.hasSharedCurrentGame = true
      
      // Después de 5 segundos, cambiar a estado "ya compartido"
      setTimeout(() => {
        shareBtn.style.background = 'linear-gradient(135deg, #666, #888)'
        shareBtn.disabled = true
      }, 5000)
      
    } catch (error) {
      console.error('Error sharing score:', error)
      
      // Mostrar mensaje de error
      shareBtn.style.background = 'linear-gradient(135deg, #aa0000, #dd0000)'
      
      // Permitir reintento después de 3 segundos
      setTimeout(() => {
        shareBtn.disabled = false
        shareBtn.style.background = ''
      }, 3000)
    }
  }
}

// Inicializar el juego cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  new Game();
})
