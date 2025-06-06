import { Utils, Vector2 } from "./utils.js"

export class Player {
  constructor(canvas) {
    this.canvas = canvas
    // Ajustar posición para que esté un poco más abajo, justo sobre el piso
    this.position = new Vector2(canvas.width / 2, canvas.height - 80)
    // Ajustar tamaño en responsive landscape and fullscreen
    const isMobile = window.innerWidth < 1025;
    const isLandscape = window.innerWidth > window.innerHeight;
    const isFullscreen = window.innerHeight === screen.height || window.innerWidth === screen.width;
    if ((isMobile && isLandscape) || isFullscreen) {
      this.radius = 16; // Más pequeño en landscape/fullscreen móvil
    } else if (isMobile) {
      this.radius = 22;
    } else {
      this.radius = 28;
    }
    this.speed = 24
    this.targetPosition = this.position.copy()
    this.health = 3
    this.maxHealth = 3
    this.invulnerable = false
    this.invulnerabilityTime = 0
    this.shield = false
    this.speedBoost = false
    this.speedBoostTime = 0
    this.animationFrame = 0

    // Cargar imagen de la cucaracha
    this.image = new Image()
    this.image.src = 'assents/KOKOK_GAME_GFX_acc-05.png'

    // Nuevas propiedades para salto
    this.isJumping = false
    this.jumpVelocity = 0
    if (window.innerWidth < 1025) {
      this.gravity = 1.1 // Más gravedad en móviles
      this.jumpPower = -13 // Salto un poco más alto en móviles
    } else {
      this.gravity = 0.8
      this.jumpPower = -15
    }
    // Ajustar groundY para que esté justo sobre el piso
    this.groundY = canvas.height - 80
    this.baseY = this.groundY
  }

  update() {
    // Física de salto
    if (this.isJumping) {
      this.jumpVelocity += this.gravity
      this.position.y += this.jumpVelocity

      // Verificar si toca el suelo
      if (this.position.y >= this.groundY) {
        this.position.y = this.groundY
        this.isJumping = false
        this.jumpVelocity = 0
      }
    }

    // Movimiento horizontal suave MÁS RÁPIDO
    const speedMultiplier = this.speedBoost ? 2.0 : 1.0 // Duplicar velocidad si tiene speed boost
    // Ajustar velocidad según dispositivo
    const isResponsive = window.innerWidth < 1025
    const baseSpeed = isResponsive ? 0.1875 : 0.25  // Reducido de 0.25 a 0.1875 en responsive (-25%)
    const lerpFactor = (this.speedBoost ? 0.5 : baseSpeed) * speedMultiplier // Movimiento más rápido con speed boost
    this.position.x = Utils.lerp(this.position.x, this.targetPosition.x, lerpFactor)

    // Solo mover verticalmente si no está saltando
    if (!this.isJumping) {
      this.position.y = Utils.lerp(this.position.y, this.targetPosition.y, lerpFactor)
    }

    // Mantener al jugador dentro de los límites
    this.position.x = Utils.clamp(this.position.x, this.radius, this.canvas.width - this.radius)

    // Limitar movimiento vertical al suelo
    if (!this.isJumping) {
      // Permitir movimiento un poco más arriba pero manteniendo la cucaracha cerca del piso
      this.position.y = Utils.clamp(this.position.y, this.groundY - 60, this.groundY)
    }

    // Force cockroach position higher if it's off screen
    if (this.position.y > this.canvas.height - this.radius - 20) {
      this.position.y = this.canvas.height - this.radius - 20;
    }
    if (this.position.y < this.radius) {
      this.position.y = this.radius + 10;
    }

    // Actualizar invulnerabilidad
    if (this.invulnerable) {
      this.invulnerabilityTime--
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false
      }
    }

    // Actualizar speed boost
    if (this.speedBoost) {
      this.speedBoostTime--
      if (this.speedBoostTime <= 0) {
        this.speedBoost = false
      }
    }

    this.animationFrame++

    // Aumentar velocidad si power-up de velocidad está activo
    let speed = this.speed
    if (window.kokokSpeedPowerUp) {
      speed *= 1.3
    }
  }

  draw(ctx) {
    // Efecto de parpadeo si es invulnerable
    if (this.invulnerable && Math.floor(this.animationFrame / 10) % 2) {
      ctx.globalAlpha = 0.5
    }

    // Dibujar imagen de la cucaracha
    if (this.image.complete) {
      ctx.save()
      ctx.translate(this.position.x, this.position.y)
      // Tamaño ajustado: más pequeño en responsive
      const isMobile = window.innerWidth < 1025
      const imageSize = isMobile ? this.radius * 4 : this.radius * 6  // Reducido de 6 a 4 en móvil
      ctx.drawImage(this.image, -imageSize/2, -imageSize/2, imageSize, imageSize)
      ctx.restore()
    } else {
      // Fallback: dibujo original con canvas si la imagen no carga
      // Cockroach body (dark brown)
      const bodyColor = "#4B3621"
      Utils.drawEllipse(ctx, this.position.x, this.position.y, this.radius, this.radius * 0.7, bodyColor)

      // Cockroach head
      Utils.drawCircle(ctx, this.position.x, this.position.y - 10, this.radius * 0.6, "#6B4C3B")

      // Antenas
      ctx.strokeStyle = "#2C1810"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.position.x - 8, this.position.y - 20)
      ctx.lineTo(this.position.x - 12, this.position.y - 30)
      ctx.moveTo(this.position.x + 8, this.position.y - 20)
      ctx.lineTo(this.position.x + 12, this.position.y - 30)
      ctx.stroke()

      // Ojos
      Utils.drawCircle(ctx, this.position.x - 6, this.position.y - 12, 3, "white")
      Utils.drawCircle(ctx, this.position.x + 6, this.position.y - 12, 3, "white")
      Utils.drawCircle(ctx, this.position.x - 6, this.position.y - 12, 1, "black")
      Utils.drawCircle(ctx, this.position.x + 6, this.position.y - 12, 1, "black")

      // Patas (líneas simples)
      ctx.strokeStyle = "#2C1810"
      ctx.lineWidth = 2
      for (let i = 0; i < 6; i++) {
        const legX = this.position.x - 15 + i * 6
        const legY = this.position.y + this.radius * 0.5
        const legOffset = Math.sin(this.animationFrame * 0.2 + i) * 3

        ctx.beginPath()
        ctx.moveTo(legX, legY)
        ctx.lineTo(legX + legOffset, legY + 8)
        ctx.stroke()
      }
    }

    // Escudo si está activo
    if (this.shield || window.kokokShieldPowerUp) {
      ctx.strokeStyle = "#00FFFF"
      ctx.lineWidth = 4
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, this.radius + 10, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Círculo amarillo para power-up de velocidad
    if (this.speedBoost || window.kokokSpeedPowerUp) {
      const pulseEffect = Math.sin(this.animationFrame * 0.3) * 3 + 3 // Efecto de pulsación
      ctx.strokeStyle = "#FFD700"
      ctx.lineWidth = 3
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, this.radius + 8 + pulseEffect, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Partículas amarillas giratorias
      for (let i = 0; i < 8; i++) {
        const angle = (this.animationFrame * 0.1 + i * Math.PI / 4) % (Math.PI * 2)
        const particleX = this.position.x + Math.cos(angle) * (this.radius + 15)
        const particleY = this.position.y + Math.sin(angle) * (this.radius + 15)
        Utils.drawCircle(ctx, particleX, particleY, 2, "#FFD700")
      }
    }

    ctx.globalAlpha = 1
  }

  moveTo(x, y) {
    this.targetPosition.x = x
    // Solo permitir movimiento vertical si no está saltando
    if (!this.isJumping) {
      // Asegurar que la cucaracha se mantenga cerca del piso pero con algo de movimiento vertical
      this.targetPosition.y = Math.max(y, this.groundY - 40)
      this.targetPosition.y = Math.min(this.targetPosition.y, this.groundY)
    }
  }

  takeDamage() {
    if (this.invulnerable) return false

    if (this.shield || window.kokokShieldPowerUp) {
      // Desactivar escudo después de un impacto
      this.shield = false
      window.kokokShieldPowerUp = false
      return false
    }

    this.health--
    this.invulnerable = true
    this.invulnerabilityTime = 120 // 2 seconds at 60fps
    return true
  }

  activateShield() {
    this.shield = true
  }

  activateSpeedBoost() {
    this.speedBoost = true
    this.speedBoostTime = 300 // 5 seconds at 60fps
  }

  getPosition() {
    return this.position.copy()
  }

  jump() {
    if (!this.isJumping) {
      this.isJumping = true
      this.jumpVelocity = this.jumpPower
    }
  }
}
