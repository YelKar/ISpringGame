import { levels } from "./levels.js";


let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");


let GAME = {
    width: 600,
    height: 500,
    bgc: "white",
    CamX: 0,
    CamY: 0,
    HP: {
        score: undefined,
        default: 3,
        x: 20,
        y: 10
    },
    level: 0,
    run: false,
    over: -1,
    draw () {
        ctx.fillStyle = "#f00";
        ctx.beginPath();
        for (let i = 1; i <= this.HP.score; i++) {
            ctx.arc((i) * this.HP.x, this.HP.y, 10, 0, Math.PI * 2);
        }
        ctx.closePath();
        ctx.fill();
    },
    update () {
        if (!this.HP.score) {
            this.run = false;
        }
    },
    moveCam() {
        if (BALL.x < GAME.width / 2) {
            this.CamX = 0
        } else if (BALL.x > GROUND.length - GAME.width / 2) {
            this.CamX = GROUND.length - GAME.width;
        } else {
            this.CamX = BALL.x - this.width / 2
        }
    },
    start () {
        this.HP.score = this.HP.default;
        this.run = true;
        play();
    },
    nextLevel () {
        this.run = false;
    }
}

class Ground {
    constructor(yCors, color = "#a40") {
        this.brickWidth = 40;
        this.yCors = yCors.map(x => {
            x.level *= this.brickWidth;
            return x;
        });
        this.length = (this.yCors.length - 1) * this.brickWidth;
        this.zeroLevel = GAME.height - this.brickWidth * 2;
        this.color = color;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-GAME.CamX, GAME.height)
        for (let x = 0; x < this.yCors.length; x++) {
            if (this.yCors[x].isSquareAngle) {
                ctx.lineTo(
                    (x - 1) * this.brickWidth - GAME.CamX,
                    this.zeroLevel - this.yCors[x].level
                );
            }
            ctx.lineTo(
                x * this.brickWidth - GAME.CamX,
                this.zeroLevel - this.yCors[x].level
            );
        }
        ctx.lineTo(this.length - GAME.CamX, GAME.height);
        ctx.closePath();
        ctx.fill();
    }
    xToY(x) {
        let cor = this.getCor(x)
        if (cor.SQAngle) {
            return cor.nextY
        }
        return cor.prevY + cor.deltaY * cor.stepX / this.brickWidth;
    }
    getCor(x) {
        let stepX = x % this.brickWidth;
        let prevX = Math.floor(x / this.brickWidth);
        let nextX = Math.ceil(x / this.brickWidth);

        let nextPoint = this.yCors[nextX];
        let nextY = nextPoint.level;
        let SQAngle = Boolean(nextPoint.isSquareAngle)
        let prevY = SQAngle ? nextY : this.yCors[prevX].level;

        let deltaY = nextY - prevY;
        let deltaX = this.brickWidth;
        let deltaCor = (deltaY ** 2 + deltaX ** 2) ** 0.5;

        let cos = deltaX / deltaCor;
        let sin = deltaY / deltaCor;
        return {
            stepX: stepX,
            nextX: nextX,
            prevX: prevX,
            nextY: nextY,
            SQAngle: SQAngle,
            prevY: prevY,
            deltaY: deltaY,
            deltaX: deltaX,
            deltaCor: deltaCor,

            sin: sin,
            cos: cos
        }
    }
}

let BALL = {
    lastCheckPoint: {
        x: 50,
        y: 200
    },
    x: 0,
    y: 0,
    radius: 10,
    ySpeed: 0,
    xSpeed: 5,
    jumpSpeed: 12,
    G: 0.7,
    moveRight: false,
    moveLeft: false,
    isJump: false,
    color: "#00f",
    draw() {
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(this.x - GAME.CamX, this.y, this.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    },
    update() {

        if (this.y > GAME.height) {
            GAME.HP.score--;
            this.x = this.y = false;
        }
        if (!this.x && !this.y) {
            this.x = this.lastCheckPoint.x;
            this.y = this.lastCheckPoint.y;
        }
        this.move();
        this.jump();
        let hitCor = this.getHitCor();
        let groundY = GROUND.xToY(hitCor.x);

        if (hitCor.y < GROUND.zeroLevel - groundY) {
            this.y -= this.ySpeed;
            this.ySpeed -= this.G;
        } else {
            this.y = GROUND.zeroLevel - groundY - (this.radius * hitCor.cos);
            this.ySpeed = 0;
        }
        // console.log(
        //     `y=${this.y}\n` +
        //     `hy=${hitCor.y}\n` +
        //     `gy=${GROUND.zeroLevel - groundY}\n` +
        //     `(hy>=gy)=${hitCor.y >= GROUND.zeroLevel - groundY} => ` +
        //     `y=${GROUND.zeroLevel - groundY - (this.radius * hitCor.cos)}`
        // )
    },
    jump() {
        if (!this.ySpeed && this.isJump) {
            this.ySpeed = this.jumpSpeed;
            this.y -= 1;
        }
    },
    move() {
        let speed;
        if (this.ySpeed) {
            speed = this.xSpeed * 2
        } else {
            speed = this.xSpeed * 2 * this.getHitCor().cos;
        }
        
        // this.x -= this.getHitCor().sin / 10;
        for (let i = 0; i < speed; i++) {
            let x = this.x + (this.moveRight - this.moveLeft) * 0.5;
            let rightGroundY = GROUND.xToY(this.x + this.radius);
            let rightFutGroundY = GROUND.xToY(x + this.radius);
            let leftGroundY = GROUND.xToY(this.x - this.radius);
            let leftFutGroundY = GROUND.xToY(x - this.radius);
            // console.log(`y=${groundY} fy=${GAME.height - futGroundY} ${this.y + this.radius}`);
            if (
                (rightFutGroundY - rightGroundY < GROUND.brickWidth || 
                this.y + this.radius <= GROUND.zeroLevel - rightFutGroundY) && x > this.x ||
                (leftFutGroundY - leftGroundY < GROUND.brickWidth ||
                this.y + this.radius <= GROUND.zeroLevel - leftFutGroundY) && x < this.x
            ) {
                this.x = x;
            }
            if (this.x <= this.radius) {
                this.x = this.radius + 1;
            } else if (this.x + this.radius * 2 >= GROUND.length) {
                GAME.nextLevel();
            }
        }
    },
    getHitCor() {
        let corCenter = GROUND.getCor(this.x);
        let cos = corCenter.cos;
        let sin = corCenter.sin;
        let cors = [
            GROUND.getCor(this.x - this.radius),
            GROUND.getCor(this.x + this.radius),
        ]
        let localX;
        for (let cor of cors) {
            localX = cor.prevX - this.x;
            let sin = localX / GROUND.brickWidth;
        }
        return {
            y: this.y + this.radius * cos,
            x: this.x + this.radius * sin,
            sin: sin,
            cos: cos
        }
    }
}



let GROUND = new Ground(levels[GAME.level].ground);

canvas.width = GAME.width;
canvas.height = GAME.height;


function play() {
    BALL.update();
    drawFrame();
    GAME.update();
    if (GAME.run) {
        requestAnimationFrame(play);
    }
}

function clear() {
    ctx.clearRect(0, 0, GAME.width, GAME.height);
    ctx.fillStyle = GAME.bgc;
    ctx.fillRect(0, 0, GAME.width, GAME.height);
}

function drawFrame() {
    clear();
    GROUND.draw();
    BALL.draw();
    GAME.draw();
    GAME.moveCam();
}

function initEventListeners() {
    initJumpEvent();
    initMotionEvents();
    initDebugEvents();
    initGameEvents();
}

function initGameEvents() {
    window.addEventListener("keydown", (e) => {
        if (e.key == " " && !GAME.run) {
            GAME.start();
        }
    })
}

function initMotionEvents() {
    window.addEventListener("keyup", stopMotionHandler);
    window.addEventListener("keydown", beginMotionHandler);
}

function initJumpEvent() {
    window.addEventListener("keydown", (e) => {
        let key = e.key;
        if (key == "ArrowUp") {
            BALL.isJump = true;
        }
    });
    window.addEventListener("keyup", (e) => {
        let key = e.key;
        if (key == "ArrowUp") {
            BALL.isJump = false;
        }
    });
}

function initDebugEvents(){
    window.addEventListener("keydown", (e) => {
        if (e.key == "b") {
            console.log(BALL);
        }
    })
}

function stopMotionHandler(e) {
    let key = e.key;
    if (key == "ArrowRight") {
        BALL.moveRight = false;
    }
    if (key == "ArrowLeft") {
        BALL.moveLeft = false;
    }
}

function beginMotionHandler(e) {
    let key = e.key;
    if (key == "ArrowRight") {
        BALL.moveRight = true;
    }
    if (key == "ArrowLeft") {
        BALL.moveLeft = true;
    }
}


initEventListeners();
GAME.start();
console.log(GROUND.xToY(120))
console.log(GROUND.xToY(125))
