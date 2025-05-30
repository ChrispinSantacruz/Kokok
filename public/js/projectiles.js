import { Utils, Vector2 } from "./utils.js"

export class Bullet {
  constructor(x, y, direction = new Vector2(0, -1)) {
    this.position = new Vector2(x, y)
    this.velocity = direction.copy().multiply(10)
    this.radius = 8
    this.active = true
    this.trail = []
    this.type = "money"
  }

  update(canvas) {
    if (!this.active) return

    // Guardar posición para el rastro
    this.trail.push(this.position.copy())
    if (this.trail.length > 5) {
      this.trail.shift()
    }

    this.position.add(this.velocity)

    // Verificar límites
    if (
      this.position.y < -this.radius ||
      this.position.y > canvas.height + this.radius ||
      this.position.x < -this.radius ||
      this.position.x > canvas.width + this.radius
    ) {
      this.active = false
    }
  }

  draw(ctx) {
    if (!this.active) return

    // Dibujar rastro
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = ((i + 1) / this.trail.length) * 0.5
      const size = this.radius * alpha
      ctx.globalAlpha = alpha
      Utils.drawRect(ctx, this.trail[i].x - size / 2, this.trail[i].y - size / 2, size, size, "#00FF00")
    }
    ctx.globalAlpha = 1

    // Fajo de billetes
    Utils.drawRect(ctx, this.position.x - 8, this.position.y - 5, 16, 10, "#00FF00")
    Utils.drawRect(ctx, this.position.x - 6, this.position.y - 3, 12, 6, "#32CD32")

    // Símbolo de dinero
    ctx.fillStyle = "white"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText("$", this.position.x, this.position.y + 3)
  }

  checkCollision(target) {
    if (!this.active) return false
    return Utils.checkCollision(this, target)
  }

  destroy() {
    this.active = false
  }
}

export class Bomb {
  constructor(x, y, targetX, targetY, isParabolic = false) {
    this.position = new Vector2(x, y)
    this.target = new Vector2(targetX, targetY)
    this.velocity = new Vector2(0, 0)
    this.radius = 12
    this.active = true
    this.exploded = false
    this.explosionRadius = 0
    this.maxExplosionRadius = 60
    this.fuseTime = 120 // 2 segundos
    this.gravity = 0.2
    this.isParabolic = isParabolic

    // Detectar si es responsive
    const isResponsive = window.innerWidth < 1025

    // Calcular velocidad inicial para llegar al objetivo
    const distance = Utils.getDistance(this.position, this.target)
    
    if (isParabolic) {
      // Trayectoria más parabólica con mayor arco
      const deltaX = this.target.x - this.position.x
      const deltaY = this.target.y - this.position.y
      const timeMultiplier = isResponsive ? 2.0 : 1.5 // Más tiempo en responsive para mayor arco
      const time = Math.sqrt((2 * Math.abs(deltaY)) / this.gravity) * timeMultiplier
      
      this.velocity.x = deltaX / time
      this.velocity.y = (deltaY / time) - (this.gravity * time) / 2
      
      // Si el resultado da velocidad hacia arriba, corregir
      if (this.velocity.y < 0 && deltaY > 0) {
        this.velocity.y = Math.abs(this.velocity.y) * 0.5
      }
      
      this.gravity = isResponsive ? 0.12 : 0.18 // Menos gravedad en responsive
      
      // Reducir velocidad en responsive
      if (isResponsive) {
        this.velocity.x *= 0.8 // 20% más lento
        this.velocity.y *= 0.8
      }
    } else {
      // Trayectoria normal
      const time = Math.sqrt((2 * distance) / this.gravity)
      this.velocity.x = (this.target.x - this.position.x) / time * 1.5
      this.velocity.y = (this.target.y - this.position.y) / time * 1.5 - (this.gravity * time) / 2
      
      // Reducir velocidad en responsive también para bombas normales
      if (isResponsive) {
        this.velocity.x *= 0.8 // 20% más lento
        this.velocity.y *= 0.8
      }
    }
  }

  update() {
    if (!this.active) return

    if (!this.exploded) {
      this.velocity.y += this.gravity
      this.position.add(this.velocity)
      this.fuseTime--

      // Explotar al llegar al suelo o acabarse el tiempo
      if (this.position.y >= this.target.y || this.fuseTime <= 0) {
        this.exploded = true
      }
    } else {
      // Expandir explosión
      this.explosionRadius += 3
      if (this.explosionRadius >= this.maxExplosionRadius) {
        this.active = false
      }
    }
  }

  draw(ctx) {
    if (!this.active) return

    if (!this.exploded) {
      // Bomba cayendo
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.radius, "#2C3E50")
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.radius - 3, "#34495E")

      // Mecha
      ctx.strokeStyle = this.fuseTime % 20 < 10 ? "#FF0000" : "#FFA500"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.position.x, this.position.y - this.radius)
      ctx.lineTo(this.position.x, this.position.y - this.radius - 8)
      ctx.stroke()
    } else {
      // Explosión
      const alpha = 1 - this.explosionRadius / this.maxExplosionRadius
      ctx.globalAlpha = alpha

      // Círculos de explosión
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.explosionRadius, "#FF4500")
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.explosionRadius * 0.7, "#FF6347")
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.explosionRadius * 0.4, "#FFD700")

      ctx.globalAlpha = 1
    }
  }

  checkCollision(target) {
    if (!this.active || !this.exploded) return false
    return Utils.getDistance(this.position, target) < this.explosionRadius
  }
}

export class Rocket {
  constructor(x, y, target) {
    this.position = new Vector2(x, y)
    this.target = target
    this.velocity = new Vector2(0, 0)
    this.radius = 14
    this.active = true
    this.exploded = false
    this.explosionRadius = 0
    this.maxExplosionRadius = 70
    this.trail = []
    
    // Ajustar velocidad según si es responsive
    const isResponsive = window.innerWidth < 1025
    this.speed = isResponsive ? 6.4 : 8 // 20% más lento en responsive
    this.turnSpeed = 0.15
    this.health = 1
  }

  update() {
    if (!this.active) return

    if (!this.exploded) {
      // Calcular dirección hacia el objetivo
      const targetDirection = new Vector2(
        this.target.position.x - this.position.x,
        this.target.position.y - this.position.y
      ).normalize()

      // Aplicar velocidad con un poco de inercia
      this.velocity.x += (targetDirection.x * this.speed - this.velocity.x) * this.turnSpeed
      this.velocity.y += (targetDirection.y * this.speed - this.velocity.y) * this.turnSpeed

      this.position.add(this.velocity)

      // Explotar si toca el suelo
      if (this.position.y >= this.target.groundY) {
        this.exploded = true
        this.position.y = this.target.groundY
      }

      // Rastro de humo
      this.trail.push(this.position.copy())
      if (this.trail.length > 8) {
        this.trail.shift()
      }
    } else {
      // Expandir explosión
      this.explosionRadius += 2
      if (this.explosionRadius >= this.maxExplosionRadius) {
        this.active = false
      }
    }

    // Eliminar si sale de pantalla
    if (this.position.y > 700 || this.position.x < -50 || this.position.x > 850) {
      this.active = false
    }
  }

  takeDamage() {
    this.health--
    if (this.health <= 0) {
      this.exploded = true
      return true
    }
    return false
  }

  draw(ctx) {
    if (!this.active) return

    if (!this.exploded) {
      // Rastro de humo
      for (let i = 0; i < this.trail.length; i++) {
        const alpha = ((i + 1) / this.trail.length) * 0.3
        const size = this.radius * alpha
        ctx.globalAlpha = alpha
        Utils.drawCircle(ctx, this.trail[i].x, this.trail[i].y, size, "#888888")
      }
      ctx.globalAlpha = 1

      // Cuerpo del cohete
      Utils.drawRect(ctx, this.position.x - 4, this.position.y - 12, 8, 24, "#C0C0C0")
      Utils.drawRect(ctx, this.position.x - 3, this.position.y - 10, 6, 20, "#E74C3C")

      // Punta del cohete
      ctx.fillStyle = "#FFD700"
      ctx.beginPath()
      ctx.moveTo(this.position.x, this.position.y - 12)
      ctx.lineTo(this.position.x - 4, this.position.y - 8)
      ctx.lineTo(this.position.x + 4, this.position.y - 8)
      ctx.closePath()
      ctx.fill()

      // Llama del cohete
      ctx.fillStyle = "#FF4500"
      ctx.beginPath()
      ctx.moveTo(this.position.x - 2, this.position.y + 12)
      ctx.lineTo(this.position.x, this.position.y + 18)
      ctx.lineTo(this.position.x + 2, this.position.y + 12)
      ctx.closePath()
      ctx.fill()

      // Indicador de daño (parpadeo rojo cuando está dañado)
      if (this.health === 1) {
        ctx.globalAlpha = 0.5
        Utils.drawCircle(ctx, this.position.x, this.position.y, this.radius + 2, "#FF0000")
        ctx.globalAlpha = 1
      }
    } else {
      // Dibujar explosión
      const alpha = 1 - this.explosionRadius / this.maxExplosionRadius
      ctx.globalAlpha = alpha

      // Círculos de explosión
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.explosionRadius, "#FF4500")
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.explosionRadius * 0.7, "#FF6347")
      Utils.drawCircle(ctx, this.position.x, this.position.y, this.explosionRadius * 0.4, "#FFD700")

      ctx.globalAlpha = 1
    }
  }

  checkCollision(target) {
    if (!this.active) return false
    if (this.exploded) {
      return Utils.getDistance(this.position, target) < this.explosionRadius
    }
    return Utils.checkCollision(this, target)
  }

  destroy() {
    this.active = false
  }
}
