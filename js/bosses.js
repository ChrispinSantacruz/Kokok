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
    
    // Cargar imagen de Trump
    this.image = new Image()
    this.image.src = 'assents/Trump.png'
  }

  update() {
    if (!this.active) return

    // Movimiento horizontal con velocidad variable
    this.position.add(this.velocity)
    this.moveTimer++

    // Rebotar en los bordes con velocidad aumentada
    if (this.position.x <= this.radius || this.position.x >= this.canvas.width - this.radius) {
      this.velocity.x *= -1
      // Añadir aleatoriedad al rebote
      this.velocity.y = Utils.randomBetween(-2, 2) * this.speedMultiplier
    }

    // Movimiento vertical más frecuente y aleatorio
    if (this.moveTimer % 120 === 0) { // Reducido de 240 a 120 para más frecuencia
      this.velocity.y = Utils.randomBetween(-2, 2) * this.speedMultiplier
    }

    // Cambio de dirección horizontal aleatorio
    if (this.moveTimer % 180 === 0) {
      this.velocity.x = Utils.randomBetween(-2, 2) * this.speedMultiplier
    }

    this.position.y = Utils.clamp(this.position.y, 50, 150)
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
    // Aumentar velocidad y aleatoriedad al recibir daño
    this.speedMultiplier += 0.2
    this.velocity.x = Utils.randomBetween(-2, 2) * this.speedMultiplier
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
    this.canvas = canvas
    this.position = new Vector2(canvas.width / 2, 80)
    this.velocity = new Vector2(3, 0)
    this.radius = 45
    this.health = 10
    this.maxHealth = 10
    this.active = true
    this.shootTimer = 0
    this.shootInterval = 90
    this.moveTimer = 0
    this.directionChangeInterval = 60
    this.type = "elon"
    this.speedMultiplier = 1
    
    // Cargar imagen de Elon
    this.image = new Image()
    this.image.src = 'assents/Elon.png'
  }

  update() {
    if (!this.active) return

    // Movimiento más errático y rápido
    this.position.add(this.velocity)
    this.moveTimer++

    // Rebotar en los bordes con velocidad aumentada
    if (this.position.x <= this.radius || this.position.x >= this.canvas.width - this.radius) {
      this.velocity.x *= -1
      // Añadir aleatoriedad al rebote
      this.velocity.y = Utils.randomBetween(-3, 3) * this.speedMultiplier
    }

    // Cambio de dirección más frecuente y aleatorio
    if (this.moveTimer % this.directionChangeInterval === 0) {
      this.velocity.x = Utils.randomBetween(-3, 3) * this.speedMultiplier
      this.velocity.y = Utils.randomBetween(-2, 2) * this.speedMultiplier
      // Ocasionalmente hacer un movimiento más brusco
      if (Math.random() < 0.3) {
        this.velocity.multiply(1.5)
      }
    }

    // Mantener dentro de límites verticales
    this.position.y = Utils.clamp(this.position.y, 50, 150)
    this.shootTimer++
  }

  draw(ctx) {
    if (!this.active) return

    // Dibujar imagen de Elon
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

    // Posicionar a los jefes
    this.trump.position.x = canvas.width * 0.25
    this.elon.position.x = canvas.width * 0.75
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
