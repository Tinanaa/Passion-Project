class Fireworks {
  _timer = null
  _animater = null
  _useAnimationFrame = true
  
  ctx = null 
  offScreenCtx = null 
  fps = 60 
  fireworks = [] 
  fireworkCount = 8 
  fireworkInterval = 400 
  fireworkColors = DEFAULT_COLORS
  particleOptions = { 
    size: 15, 
    speed: 15,
    gravity: 0.08, 
    power: 0.93, 
    shrink: 0.97, 
    jitter: 1,
    color: 'hsla(210, 100%, 50%, 1)',
  }

  constructor(dom, options = {}) {
    if (!(dom instanceof HTMLElement)) {
      options = dom || {}
    }

    if (!dom) {
      dom = document.body
    }

    this.initCanvas(dom)

    const { particleOptions = {}, ...others } = options
    this.particleOptions = { ...this.particleOptions, ...particleOptions }
    Object.keys(others).forEach(key => this[key] = others[key])

    this._useAnimationFrame = this.fps >= 60
  }

  initCanvas(dom) {
    let canvas = dom

    const isCanvas = canvas.nodeName.toLowerCase() === 'canvas'
    if (!isCanvas) {
      canvas = document.createElement('canvas')
      dom.appendChild(canvas)
    }

    const { width, height } = dom.getBoundingClientRect()
    canvas.width = width
    canvas.height = height
    canvas.style.cssText = `width: ${width}px; height: ${height}px;`

    this.ctx = canvas.getContext('2d')

    const offScreenCanvas = canvas.cloneNode()
    this.offScreenCtx = offScreenCanvas.getContext('2d')
  }

  
  createFirework(x, y, color) {
    const { ctx, particleOptions, fireworkColors } = this
    const { width, height } = ctx.canvas
    x = x ?? random(width * 0.1, width * 0.9)
    y = y ?? random(height * 0.1, height * 0.9)
    color = color ?? random(fireworkColors)
    const particleCount = random(80, 100)

    const firework = new Firework({ particleOptions, particleCount, x, y, color })
    this.fireworks.push(firework)
  }

  
  checkFireworks() {
    this.fireworks = this.fireworks.filter(firework => !firework.isBurnOff())
  }

 
  loop() {
    let interval = this.fireworkInterval * random(0.5, 1)
    this._timer = setTimeout(() => {
      this.checkFireworks()

      if (this.fireworks.length < this.fireworkCount) {
        this.createFirework()
      }

      this.loop()
    }, interval)
  }

 
  render(animationFunction, interval) {
    this._animater = animationFunction(() => {
      const { width, height } = this.ctx.canvas

  
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      this.ctx.fillRect(0, 0, width, height)
      
      this.offScreenCtx.clearRect(0, 0, width, height)

      this.fireworks.forEach(firework => {
        firework.render(this.offScreenCtx)
      })

      this.ctx.save()
      this.ctx.globalCompositeOperation = 'lighter'
      this.ctx.drawImage(this.offScreenCtx.canvas, 0, 0, width, height)
      this.ctx.restore()

      this.render(animationFunction, interval)
    }, interval)
  }


  start() {
    this.loop()

    const animationFunction = this._useAnimationFrame ? requestAnimationFrame : setTimeout
    const interval = 16.67 * (60 / this.fps)
    this.render(animationFunction, interval)
  }

 
  pause() {
    this._timer && clearTimeout(this._timer)
    this._animater && (this._useAnimationFrame ? cancelAnimationFrame(this._animater)
      : clearTimeout(this._animater))

    this._timer = null
    this._animater = null
  }


  stop() {
    this.pause()

    this.fireworks.length = 0

    const { width, height } = this.ctx.canvas()
    this.ctx.clearRect(0, 0, width, height)
  }
}


class Firework {
  _status = STATUS.INIT

  x = 0
  y = 0

  color = 'rgba(255, 255, 255, 1)'
  particleCount = 80
  particles = []
  particleOptions = {}

  constructor(options = {}) {
    Object.keys(options).forEach(key => this[key] = options[key])
    this._status = STATUS.INIT

    this.initParticles()
  }


  initParticles() {
    const { x, y, color, particleOptions } = this
    const { size: baseSize } = particleOptions

    for (let index = 0; index < this.particleCount; index++) {
      const size = random(-baseSize / 2, baseSize / 2) + baseSize
      const particle = new Particle({ ...particleOptions, x, y, size, color })
      this.particles.push(particle)
    }
  }


  updateParticles() {
    this.particles.forEach(particle => particle.update())

    this.particles = this.particles.filter(particle => !particle.isBurnOff())

    if (this.particles.length === 0) {
      this._status = STATUS.COMPLETED
    }
  }


  render(ctx) {
    this.updateParticles()
    if (this.isBurnOff()) return

    this.particles.forEach(particle => {
      particle.render(ctx)
    })
  }

  isBurnOff() {
    return this._status === STATUS.COMPLETED
  }
}


class Particle {
  size = 10
  speed = 15
  gravity = 0.2
  power = 0.92
  shrink = 0.93
  jitter = 0.08
  color = 'hsla(210, 100%, 50%, 1)'
  shadowColor = 'hsla(210, 100%, 50%, 0.1)'

  x = 0
  y = 0 

  vel = {
    x: 0,
    y: 0,
  }

  constructor(options) {
    Object.keys(options).forEach(key => {
      this[key] = options[key]
    })
    const angle = random(0, Math.PI * 2)
    const speed = Math.cos(random(0, Math.PI / 2)) * this.speed
    this.vel = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    }
    this.shadowColor = tinycolor(this.color).setAlpha(0.1)
  }


  update() {
    this.vel.x *= this.power
    this.vel.y *= this.power

    this.vel.y += this.gravity

    const jitter = random(-1, 1) * this.jitter
    this.x += this.vel.x + jitter
    this.y += this.vel.y + jitter

    this.size *= this.shrink
  }


  render(ctx) {
    if (this.isBurnOff()) return

    ctx.save()

    const { x, y, size, color, shadowColor } = this

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2)
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.3)')
    gradient.addColorStop(0.6, color)
    gradient.addColorStop(1, shadowColor)

    ctx.fillStyle = gradient

    // ctx.beginPath()
    // ctx.arc(x, y, size, 0, Math.PI * 2, true)
    // ctx.closePath()
    // ctx.fill()

    ctx.fillRect(x, y, size, size)

    ctx.restore()
  }


  isBurnOff() {
    return this.size < 1
  }
}
