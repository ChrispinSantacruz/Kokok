// Utilidades generales del juego
export class Utils {
  static getDistance(obj1, obj2) {
    const dx = obj1.x - obj2.x
    const dy = obj1.y - obj2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  static checkCollision(obj1, obj2) {
    return this.getDistance(obj1, obj2) < obj1.radius + obj2.radius
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  static lerp(start, end, factor) {
    return start + (end - start) * factor
  }

  static randomBetween(min, max) {
    return Math.random() * (max - min) + min
  }

  static drawCircle(ctx, x, y, radius, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  static drawEllipse(ctx, x, y, radiusX, radiusY, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  static drawRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color
    ctx.fillRect(x, y, width, height)
  }

  static drawText(ctx, text, x, y, size = 16, color = "white", align = "center") {
    ctx.fillStyle = color
    ctx.font = `${size}px Arial`
    ctx.textAlign = align
    ctx.fillText(text, x, y)
  }
}

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  add(vector) {
    this.x += vector.x
    this.y += vector.y
    return this
  }

  multiply(scalar) {
    this.x *= scalar
    this.y *= scalar
    return this
  }

  normalize() {
    const length = Math.sqrt(this.x * this.x + this.y * this.y)
    if (length > 0) {
      this.x /= length
      this.y /= length
    }
    return this
  }

  copy() {
    return new Vector2(this.x, this.y)
  }
}
