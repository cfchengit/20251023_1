// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 儲存煙火物件
let fireworkActive = false; // 追蹤煙火是否啟動


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // 煙火控制邏輯：滿分時啟動煙火
        if (finalScore > 0 && finalScore === maxScore) {
            fireworkActive = true;
        } else {
            fireworkActive = false;
        }

        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 設置 HSB 顏色模式用於煙火: (Hue: 0-360, Saturation: 0-255, Brightness: 0-255, Alpha: 0-255)
    colorMode(HSB, 360, 255, 255, 255); 
    background(255); 
    // 移除 noLoop() 讓 draw 循環持續運行以實現動畫
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 煙火啟動時，使用半透明背景實現殘影效果；否則使用白色背景
    if (fireworkActive) {
        colorMode(RGB); // 使用 RGB 模式設定背景透明度
        background(0, 0, 0, 25); // 暗色半透明 (殘影效果)
    } else {
        background(255); // 白色全透明
    }

    // 煙火邏輯 (在繪製文字前運行)
    if (fireworkActive) {
        colorMode(HSB, 360, 255, 255, 255); // 切換到 HSB 繪製煙火
        
        // 每隔一段時間發射一個煙火
        if (frameCount % 40 === 0) { // 大約每 40 幀 (約 0.6 秒) 發射一次
            launchFirework();
        }

        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();

            if (fireworks[i].done()) {
                fireworks.splice(i, 1);
            }
        }
        
        colorMode(RGB); // 切換回 RGB 繪製文字
    }


    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映...
}

// =================================================================
// 步驟三：煙火特效 (當 finalScore === maxScore)
// -----------------------------------------------------------------

// Particle 類別 (爆炸碎片)
class Particle {
    constructor(x, y, hue, firework = false) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否為火箭
        this.lifespan = 255;
        this.hue = hue;
        this.acc = createVector(0, 0);
        
        // 重力在 Firework 類別中應用

        if (this.firework) {
            this.vel = createVector(0, random(-12, -8)); // 火箭向上
        } else {
            // 爆炸碎片向隨機方向
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9); // 碎片阻力
            this.lifespan -= 4; // 碎片淡出
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重置加速度
    }

    done() {
        return this.lifespan < 0;
    }

    show() {
        if (!this.firework) {
            // 碎片
            strokeWeight(2);
            // 使用 HSB: 顏色(0-360), 飽和度(0-255), 亮度(0-255), Alpha(0-255)
            stroke(this.hue, 255, 255, this.lifespan);
        } else {
            // 火箭
            strokeWeight(4);
            stroke(this.hue, 255, 255);
        }

        point(this.pos.x, this.pos.y);
    }
}

// Firework 類別 (火箭和爆炸管理)
class Firework {
    constructor(maxHeight) {
        this.maxHeight = maxHeight;
        this.hue = random(0, 360); // 隨機顏色 (0-360)
        this.firework = new Particle(random(width), height, this.hue, true); // 底部發射
        this.exploded = false;
        this.particles = [];
        this.gravity = createVector(0, 0.2); // 重力
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(this.gravity);
            this.firework.update();

            // 爆炸條件：達到最大高度或開始下降
            if (this.firework.vel.y >= 0 || this.firework.pos.y < this.maxHeight) {
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(this.gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            // 傳入 firework.pos.x 和 y 作為爆炸中心
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hue, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (const p of this.particles) {
            p.show();
        }
    }

    done() {
        // 如果已爆炸且所有碎片都已消失
        return this.exploded && this.particles.length === 0;
    }
}

// -----------------------------------------------------------------
// 輔助函數
// -----------------------------------------------------------------

function launchFirework() {
    // 限制同時存在的煙火數量
    if (fireworks.length < 5) {
        // 隨機發射高度在 Canvas 上半部
        const randomHeight = random(height * 0.2, height * 0.7); 
        fireworks.push(new Firework(randomHeight));
    }
}
