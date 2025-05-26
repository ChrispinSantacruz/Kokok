import { Utils, Vector2 } from "./utils.js"

export class PowerUp {
  constructor(x, y, type) {
    this.position = new Vector2(x, y)
    this.velocity = new Vector2(0, 1) // Movimiento más lento
    this.radius = 20 // Radio más grande para mejor colisión
    this.type = type
    this.active = true
    this.animationFrame = 0
    this.pulseScale = 1
    this.lifetime = 600 // 10 segundos de vida
  }

  update() {
    if (!this.active) return

    this.position.add(this.velocity)
    this.animationFrame++
    this.lifetime--

    // Efecto de pulsación más visible
    this.pulseScale = 1 + Math.sin(this.animationFrame * 0.15) * 0.3

    // Eliminar si sale de pantalla o se acaba el tiempo
    if (this.position.y > 700 || this.lifetime <= 0) {
      this.active = false
    }
  }

  draw(ctx) {
    if (!this.active) return

    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.scale(this.pulseScale, this.pulseScale)

    if (this.type === "shield") {
      // Escudo
      Utils.drawCircle(ctx, 0, 0, this.radius, "#00FFFF")
      Utils.drawCircle(ctx, 0, 0, this.radius - 3, "#87CEEB")

      // Símbolo de escudo
      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("🛡️", 0, 5)
    } else if (this.type === "speed") {
      // Bolsa de azúcar
      Utils.drawCircle(ctx, 0, 0, this.radius, "#FFD700")
      Utils.drawCircle(ctx, 0, 0, this.radius - 3, "#FFA500")

      // Símbolo de velocidad
      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("⚡", 0, 5)
    }

    // Brillo exterior
    ctx.globalAlpha = 0.3
    Utils.drawCircle(ctx, 0, 0, this.radius + 5, this.type === "shield" ? "#00FFFF" : "#FFD700")
    ctx.globalAlpha = 1

    ctx.restore()
  }

  checkCollision(target) {
    if (!this.active) return false
    const distance = Utils.getDistance(this.position, target.position)
    const collisionDistance = this.radius + target.radius
    return distance < collisionDistance
  }

  collect() {
    this.active = false
  }
}

export class PowerUpManager {
  constructor() {
    this.powerUps = []
    this.spawnTimer = 0
    this.spawnInterval = 300 // Reducido a 5 segundos para más power-ups
  }

  update(canvas) {
    this.spawnTimer++

    // Spawnar power-ups más frecuentemente
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnPowerUp(canvas)
      this.spawnTimer = 0
    }

    // Actualizar power-ups existentes
    this.powerUps = this.powerUps.filter((powerUp) => {
      powerUp.update()
      return powerUp.active
    })
  }

  spawnPowerUp(canvas) {
    const x = Utils.randomBetween(50, canvas.width - 50)
    const y = Utils.randomBetween(100, canvas.height - 200) // Spawnar en área accesible
    const type = Math.random() < 0.5 ? "shield" : "speed"
    const powerUp = new PowerUp(x, y, type)
    this.powerUps.push(powerUp)
    console.log(`Power-up spawned: ${type} at (${x}, ${y})`)
  }

  draw(ctx) {
    this.powerUps.forEach((powerUp) => powerUp.draw(ctx))
  }

  checkCollisions(player) {
    for (let i = 0; i < this.powerUps.length; i++) {
      const powerUp = this.powerUps[i]
      if (powerUp.active && powerUp.checkCollision(player)) {
        const type = powerUp.type
        powerUp.collect()
        console.log(`Power-up collected: ${type}`)
        return type
      }
    }
    return null
  }

  clear() {
    this.powerUps = []
    this.spawnTimer = 0
  }
}
