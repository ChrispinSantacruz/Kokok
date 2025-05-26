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
    // Permitir forzar el chequeo (por ejemplo, en cada frame)
    if ((this.score >= this.nextBossScore && !this.currentBoss && !this.bossSpawned) || force) {
      if (!this.currentBoss && !this.bossSpawned && this.score >= this.nextBossScore) {
        console.log(`Spawning boss at score: ${this.score}, next boss score: ${this.nextBossScore}`)
        this.bossSpawned = true
        this.spawnBoss()
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
    this.showBossAlert() // Mostrar el letrero de jefe en camino
    // NO crear jefe aquí, solo alerta y contador
    console.log("Jefe derrotado!")
  }

  updateUI() {
    document.getElementById("score").textContent = `Puntos: ${this.score}`
    document.getElementById("lives").textContent = `Vidas: ${this.lives}`
  }

  updatePowerUpStatus(type, active) {
    const statusElement = document.getElementById("powerUpStatus")
    if (active) {
      statusElement.style.display = "block"
      statusElement.textContent = type === "shield" ? "🛡️ ESCUDO ACTIVO" : "⚡ VELOCIDAD ACTIVA"
      if (type === "shield") window.kokokShieldPowerUp = true
      if (type === "speed") window.kokokSpeedPowerUp = true
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
}
