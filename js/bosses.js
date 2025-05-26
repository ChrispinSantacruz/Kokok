import { Utils, Vector2 } from "./utils.js"

export class TrumpBoss {
  constructor(canvas) {
    this.canvas = canvas
    this.position = new Vector2(canvas.width / 2, 80)
    this.velocity = new Vector2(2, 0)
    this.radius = 50
    this.health = 10
    this.maxHealth = 10
    this.active = true
    this.shootTimer = 0
    this.shootInterval = 120
    this.moveTimer = 0
    this.type = "trump"
    this.baseSpeed = 2
    this.speedMultiplier = 1
    this.isRandomMovement = false;
    this.randomMovementTimer = 0;
    
    // Cargar imagen de Trump
    this.image = new Image()
    this.image.src = 'assents/Trump.png'
  }

  update() {
    if (!this.active) return

    // Movimiento tipo péndulo horizontal rápido
    if (!this.isRandomMovement) {
      this.position.x += this.velocity.x
      // Rebote horizontal
      if (this.position.x <= this.radius || this.position.x >= this.canvas.width - this.radius) {
        this.velocity.x *= -1
      }
      // Fijar la posición vertical en un valor constante
      this.position.y = this.radius + 15
    } else {
      // Movimiento aleatorio temporal tras recibir daño
      this.position.add(this.velocity)
      this.randomMovementTimer--
      if (this.randomMovementTimer <= 0) {
        this.isRandomMovement = false;
        // Restaurar velocidad horizontal tipo péndulo
        this.velocity.x = (Math.random() > 0.5 ? 1 : -1) * Math.abs(this.velocity.x || 6)
        this.velocity.y = 0
      }
      // Limitar el rango vertical aún más
      this.position.y = this.radius + 15
    }
    this.shootTimer++
  }

  draw(ctx) {
    if (!this.active) return

    // Dibujar imagen de Trump
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2)
    ctx.restore()

    // Dibujar barra de vida
    const healthBarWidth = this.radius * 2
    const healthBarHeight = 5
    const healthPercentage = this.health / this.maxHealth

    ctx.fillStyle = '#ff0000'
    ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 10, healthBarWidth, healthBarHeight)
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(this.position.x - this.radius, this.position.y - this.radius - 10, healthBarWidth * healthPercentage, healthBarHeight)
  }

  shouldShoot() {
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0
      return true
    }
    return false
  }

  getShootPosition() {
    return new Vector2(this.position.x, this.position.y + this.radius)
  }

  takeDamage(damage = 1) {
    this.health -= damage
    // Activar movimiento aleatorio temporal
    this.isRandomMovement = true;
    this.randomMovementTimer = 30 + Math.floor(Math.random() * 20); // frames aleatorios
    // Aumentar velocidad y aleatoriedad al recibir daño
    this.speedMultiplier += 0.2
    this.velocity.x = Utils.randomBetween(-8, 8) * this.speedMultiplier
    this.velocity.y = Utils.randomBetween(-2, 2) * this.speedMultiplier
    
    if (this.health <= 0) {
      this.destroy()
      return true
    }
    return false
  }

  destroy() {
    this.active = false
  }
}

export class ElonBoss {
  constructor(canvas) {
    this.position = new Vector2(canvas.width / 2, 100)
    this.velocity = new Vector2(0, 0)
    this.radius = 40
    this.health = 10
    this.active = true
    this.type = "elon"
    this.canvas = canvas
    this.shootInterval = 3000 // 3 segundos entre disparos
    this.lastShootTime = 0
    this.isVisible = true
    this.visibilityTimer = 0
    this.rocketTimer = 0
    this.hasActiveRocket = false
  }

  update() {
    if (!this.active) return

    // Actualizar timers
    const currentTime = Date.now()
    
    // Manejar visibilidad
    if (!this.isVisible) {
      this.visibilityTimer -= 16 // Aproximadamente 60fps
      if (this.visibilityTimer <= 0) {
        this.isVisible = true
      }
    }

    // Manejar timer del cohete
    if (this.hasActiveRocket) {
      this.rocketTimer -= 16
      if (this.rocketTimer <= 0) {
        this.hasActiveRocket = false
        this.isVisible = false
        this.visibilityTimer = 2000 // 2 segundos de invisibilidad
      }
    }

    // Movimiento horizontal
    this.velocity.x = Math.sin(Date.now() * 0.001) * 3
    this.position.add(this.velocity)

    // Mantener dentro de los límites
    if (this.position.x < this.radius) {
      this.position.x = this.radius
      this.velocity.x *= -1
    } else if (this.position.x > this.canvas.width - this.radius) {
      this.position.x = this.canvas.width - this.radius
      this.velocity.x *= -1
    }
  }

  shouldShoot() {
    if (!this.isVisible || this.hasActiveRocket) return false

    const currentTime = Date.now()
    if (currentTime - this.lastShootTime >= this.shootInterval) {
      this.lastShootTime = currentTime
      this.hasActiveRocket = true
      this.rocketTimer = 2000 // 2 segundos para impactar el cohete
      return true
    }
    return false
  }

  draw(ctx) {
    if (!this.active || !this.isVisible) return

    // Dibujar cuerpo
    Utils.drawCircle(ctx, this.position.x, this.position.y, this.radius, "#E74C3C")
    
    // Dibujar cara
    ctx.fillStyle = "white"
    ctx.font = "30px Arial"
    ctx.textAlign = "center"
    ctx.fillText("👨‍💼", this.position.x, this.position.y + 10)

    // Dibujar indicador de cohete activo
    if (this.hasActiveRocket) {
      const alpha = Math.sin(Date.now() * 0.005) * 0.5 + 0.5
      ctx.globalAlpha = alpha
      ctx.fillStyle = "#FFD700"
      ctx.font = "20px Arial"
      ctx.fillText("🚀", this.position.x, this.position.y - 40)
      ctx.globalAlpha = 1
    }
  }

  getShootPosition() {
    return new Vector2(this.position.x, this.position.y + this.radius)
  }

  takeDamage(damage = 1) {
    // No recibir daño si está invisible
    if (!this.isVisible) return false

    this.health -= damage
    // Aumentar velocidad y aleatoriedad al recibir daño
    this.speedMultiplier += 0.3
    this.velocity.x = Utils.randomBetween(-3, 3) * this.speedMultiplier
    this.velocity.y = Utils.randomBetween(-2, 2) * this.speedMultiplier
    
    if (this.health <= 0) {
      this.destroy()
      return true
    }
    return false
  }

  destroy() {
    this.active = false
  }
}

export class FinalBoss {
  constructor(canvas) {
    this.canvas = canvas
    this.trump = new TrumpBoss(canvas)
    this.elon = new ElonBoss(canvas)
    this.roach = new BossRoach(canvas)

    // Posicionar a los jefes y ajustar dificultad en responsive landscape
    if (window.innerWidth < 1025 && window.innerWidth > window.innerHeight) {
      // Mucha más separación y jefes extremadamente pequeños (85% menos)
      this.trump.position.x = canvas.width * 0.12
      this.elon.position.x = canvas.width * 0.88
      this.trump.radius = Math.round(50 * 0.15) // original 50
      this.elon.radius = Math.round(45 * 0.15)  // original 45
      this.roach.radius = Math.round(35 * 0.15) // original 35
      // Más velocidad y aleatoriedad
      this.trump.baseSpeed = 4
      this.trump.speedMultiplier = 2
      this.elon.baseSpeed = 5
      this.elon.speedMultiplier = 2.2
      this.trump.velocity.x = 4
      this.elon.velocity.x = 5
      // Cambios de dirección y rebotes más frecuentes
      this.trump.shootInterval = 90
      this.elon.shootInterval = 70
      this.trump.moveTimer = 0
      this.elon.moveTimer = 0
      this.trump.directionChangeInterval = 40
      this.elon.directionChangeInterval = 30
    } else {
      this.trump.position.x = canvas.width * 0.25
      this.elon.position.x = canvas.width * 0.75
    }
    this.roach.position.y = canvas.height / 2

    this.active = true
    this.type = "final"
  }

  update() {
    if (!this.active) return

    this.trump.update()
    this.elon.update()
    this.roach.update()

    // Verificar si todos están muertos
    if (!this.trump.active && !this.elon.active && !this.roach.active) {
      this.active = false
    }
  }

  draw(ctx) {
    if (!this.active) return

    this.trump.draw(ctx)
    this.elon.draw(ctx)
    this.roach.draw(ctx)
  }

  shouldShoot() {
    return this.trump.shouldShoot() || this.elon.shouldShoot()
  }

  getShootPositions() {
    const positions = []
    if (this.trump.active && this.trump.shouldShoot()) {
      positions.push({ pos: this.trump.getShootPosition(), type: "bomb" })
    }
    if (this.elon.active && this.elon.shouldShoot()) {
      positions.push({ pos: this.elon.getShootPosition(), type: "rocket" })
    }
    return positions
  }

  takeDamage(x, y, damage = 1) {
    let hit = false

    // Verificar colisión con cada jefe
    if (this.trump.active && Utils.getDistance({ x, y }, this.trump.position) < this.trump.radius) {
      if (this.trump.takeDamage(damage)) hit = true
    }
    if (this.elon.active && Utils.getDistance({ x, y }, this.elon.position) < this.elon.radius) {
      if (this.elon.takeDamage(damage)) hit = true
    }
    if (this.roach.active && Utils.getDistance({ x, y }, this.roach.position) < this.roach.radius) {
      if (this.roach.takeDamage(damage)) hit = true
    }

    return hit
  }

  checkCollisionWithPlayer(player) {
    return this.roach.active && Utils.checkCollision(this.roach, player)
  }
}

class BossRoach {
  constructor(canvas) {
    this.canvas = canvas
    this.position = new Vector2(50, canvas.height / 2)
    this.velocity = new Vector2(4, 0)
    this.radius = 35
    this.health = 4 // Reducido de 8 a 4
    this.maxHealth = 4
    this.active = true
    this.stunned = false
    this.stunTime = 0
    this.direction = 1
  }

  update() {
    if (!this.active) return

    if (this.stunned) {
      this.stunTime--
      if (this.stunTime <= 0) {
        this.stunned = false
        this.velocity.x = 4 * this.direction
      }
      return
    }

    this.position.add(this.velocity)

    // Chocar con los bordes y aturdirse
    if (this.position.x <= this.radius || this.position.x >= this.canvas.width - this.radius) {
      this.stunned = true
      this.stunTime = 60 // 1 segundo
      this.velocity.x = 0
      this.direction *= -1
    }
  }

  draw(ctx) {
    if (!this.active) return

    // Efecto de aturdimiento
    if (this.stunned) {
      ctx.globalAlpha = 0.5
      // Estrellas de aturdimiento
      for (let i = 0; i < 3; i++) {
        const angle = (Date.now() * 0.01 + i * 2) % (Math.PI * 2)
        const x = this.position.x + Math.cos(angle) * 40
        const y = this.position.y - 30 + Math.sin(angle) * 10
        ctx.fillStyle = "#FFD700"
        ctx.font = "20px Arial"
        ctx.textAlign = "center"
        ctx.fillText("⭐", x, y)
      }
    }

    // Cuerpo de cucaracha gigante
    Utils.drawEllipse(ctx, this.position.x, this.position.y, this.radius, this.radius * 0.7, "#8B4513")
    Utils.drawCircle(ctx, this.position.x, this.position.y - 15, this.radius * 0.6, "#A0522D")

    // Ojos rojos malvados
    Utils.drawCircle(ctx, this.position.x - 10, this.position.y - 18, 5, "red")
    Utils.drawCircle(ctx, this.position.x + 10, this.position.y - 18, 5, "red")

    ctx.globalAlpha = 1
    this.drawHealthBar(ctx)
  }

  drawHealthBar(ctx) {
    const barWidth = 60
    const barHeight = 6
    const x = this.position.x - barWidth / 2
    const y = this.position.y - this.radius - 15

    Utils.drawRect(ctx, x, y, barWidth, barHeight, "rgba(0,0,0,0.5)")

    const healthPercent = this.health / this.maxHealth
    const healthWidth = barWidth * healthPercent
    const healthColor = healthPercent > 0.5 ? "#00FF00" : healthPercent > 0.25 ? "#FFD700" : "#FF0000"
    Utils.drawRect(ctx, x, y, healthWidth, barHeight, healthColor)
  }

  takeDamage(damage = 1) {
    this.health -= damage
    if (this.health <= 0) {
      this.destroy()
      return true
    }
    return false
  }

  destroy() {
    this.active = false
  }
}
