import '../weapp-adapter'
import * as THREE from './three.min'


let ratio = window.devicePixelRatio


function draw(canvas, params) {
  let ctx = canvas.getContext('2d')

  ctx.font = params.font
  ctx.lineWidth = params.lineWidth
  canvas.width = Math.max(2, ctx.measureText(params.str).width * ratio)
  canvas.height = Math.ceil((parseFloat(params.font) + 4) * ratio)
  ctx.clearRect(0, 0, canvas.width, canvas.height) // 清除画布

  ctx.restore(), ctx.save()
  ctx.scale(ratio, ratio)

  // 背景
  if (params.bgColor) {
    ctx.fillStyle = params.bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.fillStyle = params.fillStyle
  ctx.font = params.font
  ctx.lineWidth = params.lineWidth
  ctx.textAlign = params.textAlign
  ctx.textBaseline = params.textBaseline || 'top'
  ctx.fillText(params.str, 0, 0)
}

export class Sprite extends THREE.Object3D {
  constructor(url, onload) {
    super()
    let cb = texture => {
      // 如果是 canvas 则需要缩放回去，是图片的话不需要。绘制排行榜的话，记得获取开放数据域时设置 wx.getOpenDataContext().canvas.type = 'canvas'
      this.ratio = texture.image.type == 'canvas' ? ratio : 1
      this.texture = texture
      texture.needsUpdate = true
      texture.minFilter = texture.magFilter = THREE.LinearFilter
      this.material = new THREE.SpriteMaterial({ map: texture })
      this.sprite = new THREE.Sprite(this.material)
      this.add(this.sprite)

      this.sprite.scale.set(this.width, this.height, 1)
      // this.sprite.center.set(0, 1) // anchor 设置在左上角

      if (onload) {
        onload(this)
      }
    }

    if (url instanceof THREE.Texture) {
      cb(url)
      return
    }
    new THREE.TextureLoader().load(url, cb)
  }

  updateTexture() {
    this.texture.needsUpdate = true
    this.sprite.scale.set(this.width, this.height, 1)
  }

  raycast() {
    return this.sprite.raycast.apply(this.sprite, arguments)
  }

  // 缩放回去
  get width() { return this.texture.image.width / this.ratio }
  get height() { return this.texture.image.height / this.ratio }

  get center() { return this.sprite.center }
  set center(v) { return this.sprite.center.set(v) }
}

export class Text2D extends THREE.Object3D {
  constructor(str, params) {
    super()
    str = str || ''
    params = params || {}
    params.str = str
    params.font = params.font || '30px Arial'
    params.fillStyle = params.fillStyle || '#ffff00'
    params.lineWidth = params.lineWidth || 1
    params.textAlign = params.textAlign || 'left'
    params.textBaseline = params.textBaseline || 'top'

    this.canvas = document.createElement('canvas')
    this.canvas.getContext('2d').save()
    this.params = params

    draw(this.canvas, this.params)

    let texture = new THREE.CanvasTexture(this.canvas)
    this.sprite = new Sprite(texture)
    this.add(this.sprite)
  }

  updateText() {
    draw(this.canvas, this.params)
    this.sprite.updateTexture()
  }

  get width() { return this.sprite.width }
  get height() { return this.sprite.height }

  get text() { return this.params.str }
  set text(v) {
    if (this.params.str == v) return
    this.params.str = v
    this.updateText()
  }

  get center() { return this.sprite.center }
  set center(v) { return this.sprite.center.set(v) }
}
