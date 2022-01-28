import './style.css'

import roadImage from './img/road.jpg'
import carImage from './img/car.png'
import patrolImage from './img/patrol.png'

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const game = { over: false, active: true }
let frames = 0
let seconds = 0
let speed = 0.25
let lap = 180

canvas.width = 300
canvas.height = window.innerHeight - 10

const resultEl = document.querySelector('#resultEl');
const timeEl = document.querySelector('#time')
timeEl.innerText = `REMAINING TIME: ${lap - seconds}`

class Player {
  constructor() {
    this.velocity = {
      x: 0,
      y: 0
    }
    this.image = new Image()
    this.image.src = carImage
    this.image.onload = () => {
      this.ready = true
      this.width = this.image.width * 1.5
      this.height = this.image.height * 1.5
      this.position = {
        x: (canvas.width / 2) - this.width / 2,
        y: canvas.height - (this.height / 2) - 100
      }
    }
    this.alpha = 1
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = this.alpha
    ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
    ctx.restore()
  }
  update() {
    if (this.ready) {
      this.draw()
      this.position.x += this.velocity.x
    }
  }
}

let prevRandom
function getRandomX() {
  let posX, OneFifthOfRoad = canvas.width / 5
  let random;
  let randomNo = Math.random()
  if (randomNo <= 0.20) {
    random = 1
    posX = 0
  } else if (randomNo >= 0.21 && randomNo <= 0.4) {
    random = 2
    posX = OneFifthOfRoad
  } else if (randomNo >= 0.41 && randomNo <= 0.60) {
    random = 3
    posX = OneFifthOfRoad * 2
  } else if (randomNo >= 0.61 && randomNo <= 0.80) {
    random = 4
    posX = OneFifthOfRoad * 3
  } else {
    random = 5
    posX = OneFifthOfRoad * 4
  }
  if (prevRandom && prevRandom === random) {
    return getRandomX()
  } else {
    prevRandom = random
    return posX
  }
}

class Car {
  constructor({ img }) {
    this.velocity = {
      x: 0,
      y: 10 + frames / 100
    }
    this.image = new Image()
    this.image.src = img || carImage
    this.image.onload = () => {
      this.ready = true
      this.width = this.image.width * 1.75
      this.height = this.image.height * 1.75
      this.position = {
        x: getRandomX(),
        y: -this.width + 200
      }
    }
  }
  draw() {
    ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
  }
  update() {
    if (this.ready) {
      this.draw()
      this.speed++
      this.position.y += this.velocity.y
    }
  }
}

class Road {
  constructor() {
    this.position = {
      x: 0,
      y: 0
    }
    this.image = new Image()
    this.image.src = roadImage
    this.image.onload = () => {
      this.ready = true
      let imgRatio = this.image.width / canvas.width
      this.width = this.image.width / imgRatio
      this.height = this.image.height / imgRatio
      this.position.y = canvas.height - this.height
    }
    this.velocity = {
      x: 0, y: 1
    }
  }
  draw() {
    const times = Math.ceil(canvas.height / this.height)
    for (let i = 0; i <= times + 1; i++) {
      ctx.drawImage(this.image, this.position.x, this.position.y - (this.height * i), this.width, this.height)
    }
  }
  update() {
    if (this.ready) {
      this.draw()
      if (this.position.y - canvas.height >= this.height) {
        this.position.y = canvas.height - this.height
      }
      if (frames % 50 === 0) {
        this.velocity.y += speed
      }
      this.position.y += this.velocity.y
    }
  }
}

let particles = [];

/* Initialize particle object  */
class Particle {
  constructor(x, y, radius, dx, dy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dx = dx;
    this.dy = dy;
    this.alpha = 1;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = Math.random() > 0.5 ? 'red' : 'orange';
    /* Begins or reset the path for the arc created */
    ctx.beginPath();
    /* Some curve is created */
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    /* Restore the recent canvas context*/
    ctx.restore();
  }
  update() {
    this.draw();
    this.alpha -= 0.01;
    this.x += this.dx;
    this.y += this.dy;
  }
}

const keys = {
  left: { pressed: false },
  right: { pressed: false }
}

const player = new Player({})
const road = new Road()
const patrols = [];
let patrolSpawnGap = 1;

function animate() {
  if (!game.active) return
  requestAnimationFrame(animate)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  road.update()
  player.update()

  particles.forEach((particle, i) => {
    if (particle.alpha <= 0) {
      setTimeout(() => particles.splice(i, 1), 0);
    } else particle.update()
  })

  if (keys.left.pressed && player.position.x + player.velocity.x >= 0) {
    player.velocity.x += -2
  } else if (keys.right.pressed && player.position.x + player.velocity.x + player.width <= canvas.width) {
    player.velocity.x += 2
  } else {
    player.velocity.x = 0
  }

  patrols.forEach((patrol, patrolIndex) => {
    if (patrol.position.y >= canvas.height) {
      setTimeout(() => patrols.splice(patrolIndex, 1), 0)
    } else {
      patrol.update()

      if (patrol.position.y + patrol.height >= player.position.y &&
        patrol.position.y <= player.position.y + player.height &&
        patrol.position.x <= player.position.x + player.width &&
        patrol.position.x + patrol.width >= player.position.x) {
        game.over = true
        player.alpha = 0
        explode(player)
        explode(patrol)
        showResult('You lose!')
        setTimeout(() => patrols.splice(patrolIndex, 1), 0)
        setTimeout(() => {
          game.active = false
        }, 3000)
      }

    }
  })

  if (patrolSpawnGap % 50 === 0) {
    patrols.push(new Car({ img: patrolImage }))
    patrolSpawnGap = 0;
  }

  patrolSpawnGap++
  frames++

  if (frames % 60 === 0) {
    seconds++
    timeEl.innerText = `REMAINING TIME:: ${lap - seconds}`
  }

  if (seconds >= lap) {
    game.over = true
    game.active = false
    showResult("You Win!")
  }
}



function keyDownFn({ key }) {
  if (game.over) return
  switch (key) {
    case 'ArrowLeft':
    case 'a':
      keys.left.pressed = true
      keys.right.pressed = false
      break;
    case 'ArrowRight':
    case 'd':
      keys.right.pressed = true
      keys.left.pressed = false
      break;
  }
}

function keyUpFn({ key }) {
  switch (key) {
    case 'ArrowLeft':
    case 'a':
      keys.left.pressed = false
      break;
    case 'ArrowRight':
    case 'd':
      keys.right.pressed = false
      break;
  }
}

/* for particle push execution in intervals*/
function explode(obj) {
  for (let i = 0; i <= 300; i++) {
    let dx = (Math.random() - 0.5) * (Math.random() * 6);
    let dy = (Math.random() - 0.5) * (Math.random() * 6);
    let radius = Math.random() * 3;
    let particle = new Particle(obj.position.x + obj.width / 2, obj.position.y + obj.height / 2, radius, dx, dy);

    /* Adds new items like particle*/
    particles.push(particle);
  }
};

function showResult(text) {
  resultEl.innerText = text
  resultEl.classList.remove('hide')
}

addEventListener('keydown', keyDownFn)
addEventListener('keyup', keyUpFn)

animate()
