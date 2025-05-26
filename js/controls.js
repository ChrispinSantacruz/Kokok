import { Vector2 } from "./utils.js"

export class Controls {
  constructor(canvas, player, game) {
    this.canvas = canvas
    this.player = player
    this.game = game
    this.keys = {}
    this.touch = new Vector2()
    this.isTouching = false
    this.shootTimer = 0
    this.autoShoot = false

    this.setupEventListeners()
  }

  setupEventListeners() {
    // Controles de teclado
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true
      if (e.code === "Space") {
        e.preventDefault()
        this.player.jump()
      }
      if (e.code === "KeyW" || e.code === "ArrowUp") {
        e.preventDefault()
        this.player.jump()
      }
    })

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false
    })

    // Click para saltar (sin movimiento de mouse)
    this.canvas.addEventListener("click", (e) => {
      e.preventDefault()
      this.player.jump()
    })

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault()
    })

    // Controles táctiles solo para los lados
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault()
      this.isTouching = true
      this.autoShoot = true
      const rect = this.canvas.getBoundingClientRect()
      const touch = e.touches[0]
      this.touch.x = touch.clientX - rect.left
      this.touch.y = touch.clientY - rect.top

      // Solo movimiento horizontal táctil
      this.player.moveTo(this.touch.x, this.player.position.y)
    })

    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault()
      if (this.isTouching) {
        const rect = this.canvas.getBoundingClientRect()
        const touch = e.touches[0]
        this.touch.x = touch.clientX - rect.left

        // Solo movimiento horizontal
        this.player.moveTo(this.touch.x, this.player.position.y)
      }
    })

    this.canvas.addEventListener("touchend", (e) => {
      e.preventDefault()
      this.isTouching = false
      this.autoShoot = false
      // Saltar al levantar el dedo
      this.player.jump()
    })

    // Botón de salto móvil
    const jumpBtn = document.createElement("button")
    jumpBtn.id = "jumpBtn"
    jumpBtn.className = "jump-btn"
    jumpBtn.textContent = "⬆️"
    jumpBtn.style.cssText = `
      position: absolute;
      bottom: 120px;
      left: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid #000;
      background: linear-gradient(45deg, #00ff00, #32cd32);
      color: #000;
      font-size: 24px;
      cursor: pointer;
      z-index: 15;
    `
    document.getElementById("mobileControls").appendChild(jumpBtn)

    jumpBtn.addEventListener("touchstart", (e) => {
      e.preventDefault()
      this.player.jump()
    })

    jumpBtn.addEventListener("click", (e) => {
      e.preventDefault()
      this.player.jump()
    })

    // Botón de disparo
    document.getElementById("shootBtn").addEventListener("touchstart", (e) => {
      e.preventDefault()
      this.autoShoot = true
    })

    document.getElementById("shootBtn").addEventListener("touchend", (e) => {
      e.preventDefault()
      this.autoShoot = false
    })

    document.getElementById("shootBtn").addEventListener("click", (e) => {
      e.preventDefault()
      this.autoShoot = !this.autoShoot
    })

    // Prevenir zoom en móviles
    document.addEventListener(
      "touchmove",
      (e) => {
        if (e.scale !== 1) {
          e.preventDefault()
        }
      },
      { passive: false },
    )
  }

  update() {
    // Movimiento con teclado MÁS RÁPIDO
    const moveSpeed = this.player.speedBoost ? 15 : 12 // Aumentado significativamente

    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
      this.player.moveTo(this.player.position.x - moveSpeed, this.player.position.y)
    }
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
      this.player.moveTo(this.player.position.x + moveSpeed, this.player.position.y)
    }
    if (this.keys["ArrowDown"] || this.keys["KeyS"]) {
      this.player.moveTo(this.player.position.x, this.player.position.y + moveSpeed)
    }

    // Disparo automático más rápido
    if (this.autoShoot) {
      this.shootTimer++
      if (this.shootTimer >= 6) {
        // Aún más rápido
        this.shoot()
        this.shootTimer = 0
      }
    }
  }

  shoot() {
    if (this.game.gameState.gameRunning) {
      this.game.addBullet()
    }
  }
}
