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
      if (!this.keys[e.code]) {
        this.keys[e.code] = true
        if (e.code === "Space") {
          e.preventDefault()
          this.shoot()
        }
        if (e.code === "KeyW" || e.code === "ArrowUp") {
          e.preventDefault()
          this.player.jump()
        }
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

    // Botón de disparo
    const shootBtn = document.getElementById("shootBtn")
    if (shootBtn) {
      shootBtn.addEventListener("touchstart", (e) => {
        e.preventDefault()
        this.shoot()
      })
      shootBtn.addEventListener("mousedown", (e) => {
        e.preventDefault()
        this.shoot()
      })
      shootBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.shoot()
      })
    }

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

    // Botón izquierda
    const leftBtn = document.getElementById("leftPad")
    if (leftBtn) {
      leftBtn.addEventListener("touchstart", (e) => {
        e.preventDefault()
        this.keys["ArrowLeft"] = true
      })
      leftBtn.addEventListener("touchend", (e) => {
        e.preventDefault()
        this.keys["ArrowLeft"] = false
      })
      leftBtn.addEventListener("mousedown", (e) => {
        e.preventDefault()
        this.keys["ArrowLeft"] = true
      })
      leftBtn.addEventListener("mouseup", (e) => {
        e.preventDefault()
        this.keys["ArrowLeft"] = false
      })
      leftBtn.addEventListener("mouseleave", (e) => {
        e.preventDefault()
        this.keys["ArrowLeft"] = false
      })
    }
    // Botón derecha
    const rightBtn = document.getElementById("rightPad")
    if (rightBtn) {
      rightBtn.addEventListener("touchstart", (e) => {
        e.preventDefault()
        this.keys["ArrowRight"] = true
      })
      rightBtn.addEventListener("touchend", (e) => {
        e.preventDefault()
        this.keys["ArrowRight"] = false
      })
      rightBtn.addEventListener("mousedown", (e) => {
        e.preventDefault()
        this.keys["ArrowRight"] = true
      })
      rightBtn.addEventListener("mouseup", (e) => {
        e.preventDefault()
        this.keys["ArrowRight"] = false
      })
      rightBtn.addEventListener("mouseleave", (e) => {
        e.preventDefault()
        this.keys["ArrowRight"] = false
      })
    }
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
  }

  shoot() {
    if (this.game.gameState.gameRunning) {
      this.game.addBullet()
    }
  }
}
