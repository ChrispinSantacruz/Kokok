import { Player } from "./player.js"
import { TrumpBoss, ElonBoss, FinalBoss } from "./bosses.js"
import { Bullet, Bomb, Rocket } from "./projectiles.js"
import { PowerUpManager } from "./powerups.js"
import { GameState } from "./gameState.js"
import { Controls } from "./controls.js"
import { Utils } from "./utils.js"
import { Vector2 } from "./utils.js"
import { TelegramIntegration } from "./telegramIntegration.js"

export class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.gameState = new GameState()
    this.shootCooldown = 0
    this.shootCooldownTime = 300 // 300ms entre disparos
    this.telegram = new TelegramIntegration()

    this.setupCanvas()
    this.init()
    this.setupEventListeners()
    this.telegram.init()
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
      document.getElementById("mainMenu").classList.add("hidden")
      document.getElementById("instructionsScreen").classList.remove("hidden")
    })

    document.getElementById("backBtn").addEventListener("click", () => {
      document.getElementById("instructionsScreen").classList.add("hidden")
      document.getElementById("mainMenu").classList.remove("hidden")
    })

    // Botones de game over
    document.getElementById("restartBtn").addEventListener("click", () => {
      this.startGame()
    })

    document.getElementById("shareTwitterBtn").addEventListener("click", () => {
      this.gameState.shareOnTwitter()
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

    // Control de disparo móvil
    const shootBtn = document.getElementById("shootBtn")
    if (shootBtn) {
      shootBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.addBullet()
      })
    }

    // Mostrar controles móviles solo en landscape móvil
    const handleMobileControls = () => {
      const isLandscape = window.innerWidth < 1025 && window.innerWidth > window.innerHeight
      const mobileControls = document.getElementById("mobileControls")
      if (mobileControls) {
        if (isLandscape) {
          mobileControls.classList.remove("hidden")
        } else {
          mobileControls.classList.add("hidden")
        }
      }
    }
    window.addEventListener("resize", handleMobileControls)
    window.addEventListener("orientationchange", handleMobileControls)
    handleMobileControls()

    document.addEventListener("DOMContentLoaded", () => {
      const fullscreenBtn = document.getElementById("fullscreen-btn")

      // Mostrar el botón solo en modo responsive
      if (window.innerWidth < 768) {
        fullscreenBtn.style.display = "block"
      }

      fullscreenBtn.addEventListener("click", () => {
        if (this.canvas.requestFullscreen) {
          this.canvas.requestFullscreen()
        } else if (this.canvas.webkitRequestFullscreen) {
          this.canvas.webkitRequestFullscreen()
        }

        // Intentar girar la pantalla horizontalmente
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch((err) => console.warn("No se pudo girar la pantalla: ", err))
        }
      })
    })
  }

  startGame() {
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
      // Solo mostrar controles móviles si es móvil o landscape móvil
      const isMobile = window.innerWidth < 1025
      if (isMobile) {
        mobileControls.classList.add("active")
        mobileControls.classList.remove("hidden")
      } else {
        mobileControls.classList.remove("active")
        mobileControls.classList.add("hidden")
      }
    }
  }

  showMainMenu() {
    document.getElementById("gameOverScreen").classList.add("hidden")
    document.getElementById("gameUI").classList.add("hidden")
    const mobileControls = document.getElementById("mobileControls")
    if (mobileControls) {
      mobileControls.classList.remove("active")
      mobileControls.classList.add("hidden")
    }
    document.getElementById("mainMenu").classList.remove("hidden")
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
            this.addBomb(data.pos.x, data.pos.y)
          } else if (data.type === "rocket") {
            this.addRocket(data.pos.x, data.pos.y)
          }
        })
      } else if (boss.shouldShoot()) {
        if (boss.type === "trump") {
          this.addBomb(boss.position.x, boss.position.y + boss.radius)
        } else if (boss.type === "elon") {
          this.addRocket(boss.position.x, boss.position.y + boss.radius)
        }
      }

      return boss.active
    })

    // Verificar colisiones
    this.checkCollisions()

    // Actualizar partículas
    this.updateParticles()

    // Verificar power-ups con mejor detección de colisión
    const powerUpCollected = this.powerUpManager.checkCollisions(this.player)
    if (powerUpCollected) {
      console.log(`Power-up collected: ${powerUpCollected}`)
      this.gameState.updatePowerUpStatus(powerUpCollected, true)

      // Crear efecto visual
      this.createExplosion(this.player.position.x, this.player.position.y - 20, false, ["#00FFFF", "#FFD700"])

      setTimeout(
        () => {
          this.gameState.updatePowerUpStatus(powerUpCollected, false)
        },
        powerUpCollected === "shield" ? 10000 : 5000, // Escudo dura 10 segundos
      )
    }
  }

  spawnBoss() {
    // Solo spawnar si no hay jefe activo
    if (this.gameState.currentBoss || this.bosses.length > 0) {
      return
    }
    let boss
    // Alternar usando el contador de jefes derrotados
    if (this.gameState.bossDefeated % 2 === 0) {
      boss = new ElonBoss(this.canvas)
      boss.health = 10
      boss.type = 'elon'
    } else {
      boss = new TrumpBoss(this.canvas)
      boss.health = 10
      boss.type = 'trump'
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

  addBomb(x, y) {
    const targetX = this.player.position.x + Utils.randomBetween(-50, 50)
    const targetY = this.canvas.height - 75 // Ajustado para coincidir con el suelo
    const bomb = new Bomb(x, y, targetX, targetY)
    this.enemyProjectiles.push(bomb)
  }

  addRocket(x, y) {
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
          boss.health--
          this.gameState.addScore(1)
          if (boss.health <= 0) {
            this.gameState.bossDead()
            this.createExplosion(boss.position.x, boss.position.y, true)
            this.bosses = []
            this.gameState.currentBoss = null
            this.gameState.bossSpawned = false
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
        if (this.player.takeDamage()) {
          this.gameState.loseLife()
          this.createExplosion(playerPos.x, playerPos.y)
        }
      }
    })

    // Jefes vs jugador (solo para el jefe final con cucaracha)
    this.bosses.forEach((boss) => {
      if (boss.type === "final" && boss.checkCollisionWithPlayer) {
        const playerPos = this.player.getPosition()
        const distance = Utils.getDistance(boss.position, playerPos)
        
        if (distance < (this.player.radius + boss.radius)) {
          if (this.player.takeDamage()) {
            this.gameState.loseLife()
            this.createExplosion(playerPos.x, playerPos.y)
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
  }

  drawBackground() {
    // Gradiente de fondo
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
    this.gameState.gameRunning = false
    cancelAnimationFrame(this.animationId)
    
    // Compartir puntuación en Telegram
    this.telegram.shareScore(this.gameState.score)
    
    document.getElementById("gameOverScreen").classList.remove("hidden")
    document.getElementById("gameUI").classList.add("hidden")
    document.getElementById("finalScore").textContent = this.gameState.score
    
    // Ocultar controles móviles
    const mobileControls = document.getElementById("mobileControls")
    if (mobileControls) {
      mobileControls.classList.remove("active")
      mobileControls.classList.add("hidden")
    }
  }
}

// Inicializar el juego cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.innerWidth < 1025;
  const rotateOverlay = document.getElementById("rotateOverlay");
  const rotatePlayBtn = document.getElementById("rotatePlayBtn");
  if (isMobile && rotateOverlay && rotatePlayBtn) {
    rotateOverlay.classList.remove("hidden");
    rotatePlayBtn.addEventListener("click", async () => {
      // Intentar poner en landscape
      if (window.screen.orientation && window.screen.orientation.lock) {
        try {
          await window.screen.orientation.lock("landscape");
        } catch (e) {
          // No pasa nada si falla
        }
      }
      rotateOverlay.classList.add("hidden");
      new Game();
    });
  } else {
    new Game();
  }
})
