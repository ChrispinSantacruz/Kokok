// Manejo del estado del juego
export class GameState {
  constructor() {
    this.score = 0
    this.lives = 3
    this.level = 1
    this.gameRunning = false
    this.gameOver = false
    this.currentBoss = null
    this.bossDefeated = 0
    this.nextBossScore = 10 // First boss at 10 points
    this.highScore = Number.parseInt(localStorage.getItem("kokokHighScore")) || 0
    this.playerName = "Jugador"
    this.bossSpawned = false
    
    // Nuevas propiedades para cooldown de jefes
    this.bossSpawnCooldown = 0
    this.bossSpawnDelay = 2000 // Reducido de 3000 a 2000ms (2 segundos)
    this.showingBossIncoming = false
    
    // Propiedades para alerta visual interna
    this.bossAlertTimer = 0
    this.bossAlertText = ""
    this.bossAlertSubtext = ""
  }

  addScore(points) {
    this.score += points
    this.updateUI()
    // Boss appearance is no longer controlled by score
  }

  loseLife() {
    this.lives--
    this.updateUI()
    if (this.lives <= 0) {
      this.endGame()
    }
  }

  checkBossSpawn(force = false) {
    // Verificar si está en cooldown
    if (this.bossSpawnCooldown > 0 && Date.now() < this.bossSpawnCooldown) {
      return false
    }
    
    // Permitir forzar el chequeo (por ejemplo, en cada frame)
    if ((this.score >= this.nextBossScore && !this.currentBoss && !this.bossSpawned && !this.showingBossIncoming) || force) {
      if (!this.currentBoss && !this.bossSpawned && this.score >= this.nextBossScore && !this.showingBossIncoming) {
        console.log(`Spawning boss at score: ${this.score}, next boss score: ${this.nextBossScore}`)
        this.bossSpawned = true
        this.bossSpawnCooldown = 0 // Reset cooldown
        return true
      }
    }
    return false
  }

  spawnBoss() {
    this.showBossAlert()
    // Solo alerta visual, no crear jefe aquí
    setTimeout(() => {
      this.bossSpawned = false // Permitir que el game loop spawne el jefe
      this.currentBoss = null // Asegurar que no haya jefe actual
    }, 2000)
  }

  showBossAlert() {
    const alert = document.getElementById("bossAlert")
    alert.innerHTML = '<img src="assents/jefe.png" alt="Boss incoming" style="max-width: 400px; width: 100%;">'
    alert.classList.remove("hidden")
    setTimeout(() => {
      alert.classList.add("hidden")
      alert.innerHTML = ""
    }, 3000) // 3 segundos
  }

  bossDead() {
    this.currentBoss = null
    this.bossDefeated++
    this.bossSpawned = false
    
    // Immediately show "boss incoming" screen
    this.showBossIncomingAlert()
    
    // Activate cooldown for next boss (after alert ends + 0.5s extra)
    this.bossSpawnCooldown = Date.now() + this.bossSpawnDelay // 2s total
    
    console.log("Boss defeated!")
  }

  updateUI() {
    // Formato vertical: título arriba, número abajo
    document.getElementById("score").innerHTML = `<div class="score-label">SCORE</div><div class="score-number">${this.score}</div>`
    
    // Actualizar imágenes de vidas
    this.updateLivesDisplay()
  }

  updateLivesDisplay() {
    // Actualizar cada icono de vida
    for (let i = 1; i <= 3; i++) {
      const lifeIcon = document.getElementById(`life${i}`)
      if (lifeIcon) {
        if (i <= this.lives) {
          // Vida activa - mostrar normal
          lifeIcon.classList.remove('lost')
        } else {
          // Vida perdida - mostrar tachada
          lifeIcon.classList.add('lost')
        }
      }
    }
  }

  updatePowerUpStatus(type, active) {
    const statusElement = document.getElementById("powerUpStatus")
    if (active) {
      statusElement.style.display = "block"
      if (type === "shield") {
        statusElement.innerHTML = '<img src="assents/Escudo.png" alt="Shield" class="powerup-icon"> SHIELD ACTIVE'
        window.kokokShieldPowerUp = true
      } else if (type === "speed") {
        statusElement.innerHTML = '<img src="assents/Velocidad.png" alt="Speed" class="powerup-icon"> SPEED ACTIVE'
        window.kokokSpeedPowerUp = true
      } else if (type === "life") {
        statusElement.innerHTML = '<img src="assents/VidaExtra.png" alt="Life" class="powerup-icon"> LIFE RECOVERED'
        statusElement.style.display = "block"
        // La vida se muestra solo por 2 segundos como notificación
        setTimeout(() => {
          statusElement.style.display = "none"
        }, 2000)
        return // No continuar con la lógica normal
      }
    } else {
      statusElement.style.display = "none"
      if (type === "shield") window.kokokShieldPowerUp = false
      if (type === "speed") window.kokokSpeedPowerUp = false
    }
  }

  endGame() {
    this.gameRunning = false
    this.gameOver = true

    if (this.score > this.highScore) {
      this.highScore = this.score
      localStorage.setItem("kokokHighScore", this.highScore.toString())
    }

    // Solo actualizar datos, no UI - eso lo maneja game.gameOver()
    console.log("GameState: Game ended, score:", this.score, "high score:", this.highScore)
  }

  reset() {
    this.score = 0
    this.lives = 3
    this.level = 1
    this.gameRunning = true
    this.gameOver = false
    this.currentBoss = null
    this.bossDefeated = 0
    this.nextBossScore = 10 // Ensure first boss appears at 10 points
    this.bossSpawned = false // Reset boss flag
    this.bossSpawnCooldown = 0 // Reiniciar cooldown
    this.showingBossIncoming = false // Reiniciar flag de pantalla
    this.bossAlertTimer = 0 // Reiniciar timer de alerta
    this.bossAlertText = "" // Reiniciar texto de alerta
    this.bossAlertSubtext = "" // Reiniciar subtexto de alerta
    this.updateUI()

    document.getElementById("gameOverScreen").classList.add("hidden")
    document.getElementById("mainMenu").classList.add("hidden")
    document.getElementById("instructionsScreen").classList.add("hidden")
    document.getElementById("gameUI").classList.remove("hidden")
    document.getElementById("mobileControls").classList.remove("hidden")
  }

  start() {
    this.reset()
  }

  shareOnTwitter() {
    const text = `I just scored ${this.score} points in KOKOK The Roach! 🪳💰 Can you beat me?`
    const url = encodeURIComponent(window.location.href)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}&hashtags=KOKOKTheRoach,CryptoGame`
    window.open(twitterUrl, "_blank")
  }

  showBossIncomingAlert() {
    this.showingBossIncoming = true
    
    // Usar sistema interno en lugar de elemento HTML
    this.bossAlertTimer = 90 // 1.5 segundos a 60fps (reducido de 180)
    this.bossAlertText = "⚠️ BOSS INCOMING ⚠️"
    this.bossAlertSubtext = "Get ready for battle..."
  }

  updateBossAlert() {
    if (this.bossAlertTimer > 0) {
      this.bossAlertTimer--
      if (this.bossAlertTimer <= 0) {
        this.showingBossIncoming = false
        this.bossAlertText = ""
        this.bossAlertSubtext = ""
      }
    }
  }

  drawBossAlert(ctx, canvas) {
    if (this.bossAlertTimer <= 0) return

    // Fondo semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Efecto de parpadeo
    const alpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.7

    // Texto principal
    ctx.globalAlpha = alpha
    ctx.fillStyle = "#ff6b6b"
    ctx.font = "bold 36px Arial"
    ctx.textAlign = "center"
    ctx.fillText(this.bossAlertText, canvas.width / 2, canvas.height / 2 - 20)

    // Subtexto
    ctx.fillStyle = "white"
    ctx.font = "24px Arial"
    ctx.fillText(this.bossAlertSubtext, canvas.width / 2, canvas.height / 2 + 20)

    ctx.globalAlpha = 1
  }
}
