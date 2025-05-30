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
    this.nextBossScore = 10 // Primer jefe a los 10 puntos
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
    // Ya no se controla la aparición de jefe por puntos
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
    alert.innerHTML = '<img src="assents/jefe.png" alt="Jefe en camino" style="max-width: 400px; width: 100%;">'
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
    
    // Mostrar inmediatamente la pantalla de "jefe en camino"
    this.showBossIncomingAlert()
    
    // Activar cooldown para el próximo jefe (después de que termine la alerta + 0.5s extra)
    this.bossSpawnCooldown = Date.now() + this.bossSpawnDelay // 2s total
    
    console.log("Jefe derrotado!")
  }

  updateUI() {
    // Formato vertical: título arriba, número abajo
    document.getElementById("score").innerHTML = `<div class="score-label">PUNTOS</div><div class="score-number">${this.score}</div>`
    document.getElementById("lives").innerHTML = `<div class="lives-label">VIDAS</div><div class="lives-number">${this.lives}</div>`
  }

  updatePowerUpStatus(type, active) {
    const statusElement = document.getElementById("powerUpStatus")
    if (active) {
      statusElement.style.display = "block"
      if (type === "shield") {
        statusElement.textContent = "🛡️ ESCUDO ACTIVO"
        window.kokokShieldPowerUp = true
      } else if (type === "speed") {
        statusElement.textContent = "⚡ VELOCIDAD ACTIVA"
        window.kokokSpeedPowerUp = true
      } else if (type === "life") {
        statusElement.textContent = "❤️ VIDA RECUPERADA"
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

    document.getElementById("finalScore").textContent = this.score
    document.getElementById("highScore").textContent = this.highScore
    document.getElementById("gameOverScreen").classList.remove("hidden")
    document.getElementById("gameUI").classList.add("hidden")
    document.getElementById("mobileControls").classList.add("hidden")
  }

  reset() {
    this.score = 0
    this.lives = 3
    this.level = 1
    this.gameRunning = true
    this.gameOver = false
    this.currentBoss = null
    this.bossDefeated = 0
    this.nextBossScore = 10 // Aseguramos que el primer jefe aparezca a los 10 puntos
    this.bossSpawned = false // Reiniciar el flag de jefe
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
    const text = `¡Acabo de conseguir ${this.score} puntos en KOKOK The Roach! 🪳💰 ¿Puedes superarme?`
    const url = encodeURIComponent(window.location.href)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}&hashtags=KOKOKTheRoach,CryptoGame`
    window.open(twitterUrl, "_blank")
  }

  showBossIncomingAlert() {
    this.showingBossIncoming = true
    
    // Usar sistema interno en lugar de elemento HTML
    this.bossAlertTimer = 90 // 1.5 segundos a 60fps (reducido de 180)
    this.bossAlertText = "⚠️ JEFE EN CAMINO ⚠️"
    this.bossAlertSubtext = "Prepárate para la batalla..."
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
