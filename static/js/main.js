const app = new PIXI.Application({
    view: document.getElementById('main'),
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    backgroundColor: 0x000000,
});
const b = new Bump(PIXI);
document.body.appendChild(app.view);

const api_gacha = axios.create({
    baseURL: 'http://gpu4.miplab.org:8999',
})

class Game {        
    constructor(loader) {
        this._loader = loader;
        this._scenes = new Object();
        this.reset();
    }
    get loader(){
        return this._loader;
    }
    set loader(value){
        this._loader = value;        
    }
    get scenes(){
        return this._scenes;
    }
    set scenes(value){
        this._scenes = value;
    }
    get shells(){
        return this._shells;
    }
    set shells(value){
        this._shells = value;
    }
    get shell_velocity(){
        return this._shell_velocity;
    }
    set shell_velocity(value){
        this._shell_velocity = value;
    }
    get state(){
        return this._state;
    }
    set state(value){
        this._state = value;
    }
    get bg(){
        return this._bg;
    }
    set bg(value){
        this._bg = value;
    }
    get score(){
        return this._score;
    }
    set score(value){
        this._score = value;
    }
    compute_score(gacha_rewards){
        this.score = 0;
        for(let i = 0; i < gacha_rewards.length; i++){
            switch(gacha_rewards[i]){
                case 0: // copper
                    this.score += 100000000;
                    break;
                case 1:
                    this.score += 400000000;
                    break;
                case 2:
                    this.score += 3000000000;
                    break;
            }
        }
    }

    reset() {
        this.scenes.start = new Object();
        this.scenes.gacha_single = new Object();
        this.scenes.gacha_ten = new Object();
        this.scenes.end_game = new Object();

        this.scenes.start.handle = null;
        this.scenes.start.gacha_single_btn = null;
        this.scenes.start.gacha_ten_btn = null;
        
        this.scenes.gacha_single.handle = null;
        this.scenes.gacha_single.charging_handle = null;
        this.scenes.gacha_single.bolt = null;
        this.scenes.gacha_single.muzzle_flush = null;
        this.scenes.gacha_single.rifle_no_bolt = null;
        this.scenes.gacha_single.rifle = null;
        this.scenes.gacha_single.bullet = null;
        this.scenes.gacha_single.bolt_hitbox = null;
        this.scenes.gacha_single.trigger_hitbox = null;
        
        this.scenes.gacha_ten.handle = null;
        this.scenes.gacha_ten.charging_handle = null;
        this.scenes.gacha_ten.bolt = null;
        this.scenes.gacha_ten.muzzle_flush = null;
        this.scenes.gacha_ten.rifle_no_mag = null;
        this.scenes.gacha_ten.rifle_no_mag_with_bolt = null;
        this.scenes.gacha_ten.mag = null;
        this.scenes.gacha_ten.mag_insert_hitbox = null;
        this.scenes.gacha_ten.trigger_hitbox = null;
        this.scenes.gacha_ten.back_btn = null;
        this.scenes.gacha_ten.mag_guide_hitboxes = [];

        this.shells = [];

        this.shell_velocity = [];

        this.state = 'start';

        this.bg = null;

        this.score = 0;
    }

    shells_push(value) {
        this.shells.push(value);
    }
}

class Timer{
    constructor(){
        this.global_timer = 0;
    }
}

class RainbowlifyTimer extends Timer{
    constructor(){
        super();
        this.reset();
    }
    do_next_rainbow(){
        if(this.global_timer == this.next_rainbow_time){
            this.next_rainbow_time += this.DELAY_BETWEEN_RAINBOWLIFY;
            return true;
        }
        return false;
    }
    reset(){
        this.global_timer = 0;
        this.next_rainbow_time = 1;
        this.DELAY_BETWEEN_RAINBOWLIFY = 700;
        this.speed = 1.0;
        this.last_rainbowlify_idx = -1;
        this.DELAY_TO_RAINBOWLIFY = 50;
        this.DELAY_BETWEEN_ZOOM = 5;
        this.flash_time = 40;
        this.DELAY_BETWEEN_FLASH = 100;
    }
}

class RankTimer extends Timer{
    constructor(){
        super();
        this.reset();
    }
    reset(){
        this.global_timer = 0;
        this.DELAY_BETWEEN_SCORE_WORD = 50;
        this.DELAY_BETWEEN_RANK_WORD = 25;
        this.DELAY_BETWEEN_SCORE_RANK = 25;
        this.DELAY_BETWEEN_SUGOI = 1;
    }
    
}

var game = new Game(app.loader);
//var loader = app.loader;

const resources_start = [
    "./src/img/gacha_single.png",
    "./src/img/gacha_ten.png",
    "./src/img/bg.png"
]

const resources_charging = [
    "./src/img/charging_handle.svg",
    "./src/img/bolt.svg",
]

const resources_both = [
    "./src/img/bullet_gold.svg",
    "./src/img/bullet_silver.svg",
    "./src/img/bullet_rainbow.svg",
    "./src/img/muzzle_flush.svg",
    "./src/img/rainbow_bg.png",
]

const resources_single = [
    "./src/img/rifle_no_bolt.svg", 
    "./src/img/full_rifle.svg", 
    "./src/img/bullet.svg",
]

const resources_ten = ["./src/img/rifle_no_mag.svg",
    "./src/img/mag.svg",
    "./src/img/rifle_no_mag_with_bolt.svg"
]

const resources_return = [
    "./src/img/back.png",
    "./src/img/number/0.png",
    "./src/img/number/1.png",
    "./src/img/number/2.png",
    "./src/img/number/3.png",
    "./src/img/number/4.png",
    "./src/img/number/5.png",
    "./src/img/number/6.png",
    "./src/img/number/7.png",
    "./src/img/number/8.png",
    "./src/img/number/9.png",
    './src/img/number/yi.png',
    './src/img/S.png',
    './src/img/R.png',
]

const sound_effects = {
    "single_round_loading": PIXI.sound.Sound.from("./src/sound/single round loading.mp3"),
    "firing": PIXI.sound.Sound.from("./src/sound/firing.mp3"),
    "python": PIXI.sound.Sound.from("./src/sound/python_sound.mp3"),
    "bolt_forward": PIXI.sound.Sound.from("./src/sound/bolt_forward.mp3"),
    "put_meg_in": PIXI.sound.Sound.from("./src/sound/put_meg_in.mp3"),
    "shell_drop": PIXI.sound.Sound.from("./src/sound/shell_drop.mp3"),
    "2434": PIXI.sound.Sound.from("./src/sound/2434.mp3"),
    "heart_sound": PIXI.sound.Sound.from("./src/sound/heart_sound.mp3"),
    "item_fall": PIXI.sound.Sound.from("./src/sound/item_fall.mp3"),
    "failed_rainbow": PIXI.sound.Sound.from({
        url: "./src/sound/failed_rainbow.mp3",
        speed: 0.8
    }),
    "sugoi": PIXI.sound.Sound.from("./src/sound/sugoi.mp3"),
}

game.loader
.add(resources_start)
.add(resources_charging)
.add(resources_both)
.add(resources_single)
.add(resources_ten)
.add(resources_return)
.load(start);

app.ticker_gameLoop = function(delta){
    state(delta);
}

let state, gacha_global_time = 0, gacha_result = [0, 1, 2, 2, 1, 2, 0 ,0 ,1 ,2]; // TODO: post gpu4.miplab.org:8999
let rainbowlify_timer = new RainbowlifyTimer();
let rank_timer = new RankTimer();
let muzzle_flush_open_time = 0;         // TODO: move this in the object
let gravitational_acceleration = 0.8;   // TODO: turn this into constant

function start() {
    let bg = new PIXI.Sprite(game.loader.resources['./src/img/bg.png'].texture);
    bg.scale.set((window.innerWidth+400)/bg.width, (window.innerHeight+300)/bg.height);
    bg.position.set(-200, -200);
    game.bg = bg;
    app.stage.addChild(game.bg);
    /*scene_start*/
    game.scenes.start.handle = new PIXI.Container();
    // TODO: change layout
    let gacha_single_btn = new PIXI.Sprite(game.loader.resources['./src/img/gacha_single.png'].texture);
    gacha_single_btn.interactive = true;
    gacha_single_btn.buttonMode = true;
    gacha_single_btn.x = 100;
    gacha_single_btn.y = 170;
    gacha_single_btn.scale.set(0.7, 0.7);
    gacha_single_btn.gacha_num = 1;
    gacha_single_btn.on('pointerdown', onGachaBtnClick);
    game.scenes.start.gacha_single_btn = gacha_single_btn;

    let gacha_ten_btn = new PIXI.Sprite(game.loader.resources['./src/img/gacha_ten.png'].texture);
    gacha_ten_btn.interactive = true;
    gacha_ten_btn.buttonMode = true;
    gacha_ten_btn.x = 700;
    gacha_ten_btn.y = 80;
    gacha_ten_btn.scale.set(0.7, 0.7);
    gacha_ten_btn.gacha_num = 10;
    gacha_ten_btn.on('pointerdown', onGachaBtnClick);
    game.scenes.start.gacha_ten_btn = gacha_ten_btn;

    game.scenes.start.gacha_ten_btn.mouseover = game.scenes.start.gacha_single_btn.mouseover = function(){ sound_effects["python"].play(); };
    game.scenes.start.gacha_ten_btn.mouseout = game.scenes.start.gacha_single_btn.mouseout = function(){ sound_effects["python"].stop(); };

    game.scenes.start.handle.addChild(game.scenes.start.gacha_single_btn);
    game.scenes.start.handle.addChild(game.scenes.start.gacha_ten_btn);

    app.stage.addChild(game.scenes.start.handle);
    /*scene_start*/
}

function scene_1(){
    /*charging handle and bolt*/
    charging_handle = new PIXI.Sprite(game.loader.resources['./src/img/charging_handle.svg'].texture);
    charging_handle.scale.set(0.1, 0.1);
    charging_handle.x = 230;
    charging_handle.y = 120;
    charging_handle.interactive = false;
    charging_handle.buttonMode = false;
    charging_handle
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd_chargingHandle)
        .on('pointerupoutside', onDragEnd_chargingHandle)
        .on('pointermove', onDragMove_chargingHandle)
    game.scenes.gacha_single.charging_handle = charging_handle;

    bolt = new PIXI.Sprite(game.loader.resources['./src/img/bolt.svg'].texture);
    bolt.scale.set(0.1, 0.1);
    bolt.x = 230;
    bolt.y = 135;
    game.scenes.gacha_single.bolt = bolt;
    // close (315, 135)
    //bolt.x = 315;

    // loading muzzle flush
    muzzle_flush = new PIXI.Sprite(game.loader.resources['./src/img/muzzle_flush.svg'].texture);
    muzzle_flush.scale.set(0.3, 0.3);
    muzzle_flush.x = 740;
    muzzle_flush.y = 40;
    muzzle_flush.visible = false;
    game.scenes.gacha_single.muzzle_flush = muzzle_flush;

    /*charging handle and bolt*/
    
    /*scene_gacha_single*/
    game.scenes.gacha_single.handle = new PIXI.Container();
    let rifle_no_bolt = new PIXI.Sprite(game.loader.resources['./src/img/rifle_no_bolt.svg'].texture);
    rifle_no_bolt.scale.set(0.5, 0.5);
    game.scenes.gacha_single.rifle_no_bolt = rifle_no_bolt;
    
    let rifle = new PIXI.Sprite(game.loader.resources['./src/img/full_rifle.svg'].texture);
    rifle.scale.set(0.5, 0.5);
    game.scenes.gacha_single.rifle = rifle;

    bullet = new PIXI.Sprite(game.loader.resources['./src/img/bullet.svg'].texture);
    bullet.scale.set(0.05, 0.05);
    bullet.interactive = true;
    bullet.buttonMode = true;
    bullet.anchor.set(0.5);
    bullet.x = 800;
    bullet.y = 400;
    bullet
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);
    game.scenes.gacha_single.bullet = bullet;
    
    bolt_hitbox = new PIXI.Graphics();
    bolt_hitbox.beginFill(0x000000);
    bolt_hitbox.drawRect(0, 0, 75, 15);
    bolt_hitbox.endFill();
    bolt_hitbox.x = 375;
    bolt_hitbox.y = 180;
    bolt_hitbox.alpha = 0;
    game.scenes.gacha_single.bolt_hitbox = bolt_hitbox;

    trigger_hitbox = new PIXI.Graphics();
    trigger_hitbox.beginFill(0x000000);
    trigger_hitbox.drawRect(0, 0, 65, 30);
    trigger_hitbox.endFill();
    trigger_hitbox.x = 318.5;
    trigger_hitbox.y = 247.5;
    trigger_hitbox.alpha = 0;
    game.scenes.gacha_single.trigger_hitbox = trigger_hitbox;


    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.rifle);
    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.bolt_hitbox);
    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.trigger_hitbox);
    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.charging_handle);
    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.bolt);
    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.rifle_no_bolt);
    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.bullet);
    game.scenes.gacha_single.handle.addChild(game.scenes.gacha_single.muzzle_flush);
    game.scenes.gacha_single.handle.visible = false;

    app.stage.addChild(game.scenes.gacha_single.handle);
    /*scene_gacha_single*/
}

function scene_10(){
    /*charging handle and bolt*/
    charging_handle = new PIXI.Sprite(game.loader.resources['./src/img/charging_handle.svg'].texture);
    charging_handle.scale.set(0.1, 0.1);
    charging_handle.x = 230;
    charging_handle.y = 130;
    charging_handle.interactive = false;
    charging_handle.buttonMode = false;
    charging_handle
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd_chargingHandle)
        .on('pointerupoutside', onDragEnd_chargingHandle)
        .on('pointermove', onDragMove_chargingHandle)
    game.scenes.gacha_ten.charging_handle = charging_handle;

    bolt = new PIXI.Sprite(game.loader.resources['./src/img/bolt.svg'].texture);
    bolt.scale.set(0.1, 0.1);
    bolt.x = 230;
    bolt.y = 145;
    game.scenes.gacha_ten.bolt = bolt;
    // close (315, 135)
    //bolt.x = 315;


    // loading muzzle flush
    muzzle_flush = new PIXI.Sprite(game.loader.resources['./src/img/muzzle_flush.svg'].texture);
    muzzle_flush.scale.set(0.3, 0.3);
    muzzle_flush.x = 740;
    muzzle_flush.y = 40;
    muzzle_flush.visible = false;
    game.scenes.gacha_ten.muzzle_flush = muzzle_flush;


    /*charging handle and bolt*/
    /*scene_gacha_ten*/
    game.scenes.gacha_ten.handle = new PIXI.Container();
    let rifle_no_mag = new PIXI.Sprite(game.loader.resources['./src/img/rifle_no_mag.svg'].texture);
    rifle_no_mag.scale.set(0.5, 0.5);
    game.scenes.gacha_ten.rifle_no_mag = rifle_no_mag;
    let rifle_no_mag_with_bolt = new PIXI.Sprite(game.loader.resources['./src/img/rifle_no_mag_with_bolt.svg'].texture);
    rifle_no_mag_with_bolt.scale.set(0.5, 0.5);
    game.scenes.gacha_ten.rifle_no_mag_with_bolt = rifle_no_mag_with_bolt;

    mag = new PIXI.Sprite(game.loader.resources['./src/img/mag.svg'].texture);
    mag.scale.set(0.7);
    mag.interactive = true;
    mag.buttonMode = true;
    mag.anchor.set(0.5);
    mag.x = 1100;
    mag.y = 300;
    mag
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);
    game.scenes.gacha_ten.mag = mag;

    mag_insert_hitbox = new PIXI.Graphics();
    mag_insert_hitbox.beginFill(0x000000);
    mag_insert_hitbox.drawRect(0,0,30,30);
    mag_insert_hitbox.endFill();
    mag_insert_hitbox.x = 390;
    mag_insert_hitbox.y = 180;
    mag_insert_hitbox.alpha = 0;
    game.scenes.gacha_ten.mag_insert_hitbox = mag_insert_hitbox;

    mag_guide_hitboxes_size = [[300, 300], [100, 300], [300, 300]];
    mag_guide_hitboxes_pos = [[75, -10], [500, -40], [200, -100]];
    mag_guide_hitboxes = [];
    for(i=0; i<mag_guide_hitboxes_pos.length; ++i){
        gh = new PIXI.Graphics();
        gh.beginFill(0x000000);
        gh.drawRect(0,0,mag_guide_hitboxes_size[i][0],mag_guide_hitboxes_size[i][1]);
        gh.endFill();
        gh.x = mag_guide_hitboxes_pos[i][0];
        gh.y = mag_guide_hitboxes_pos[i][1];
        gh.alpha = 0;
        mag_guide_hitboxes.push(gh);
    }
    game.scenes.gacha_ten.mag_guide_hitboxes = mag_guide_hitboxes;

    trigger_hitbox = new PIXI.Graphics();
    trigger_hitbox.beginFill(0x000000);
    trigger_hitbox.drawRect(0, 0, 65, 30);
    trigger_hitbox.endFill();
    trigger_hitbox.x = 318.5;
    trigger_hitbox.y = 247.5;
    trigger_hitbox.alpha = 0;
    game.scenes.gacha_ten.trigger_hitbox = trigger_hitbox;

    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.rifle_no_mag_with_bolt);
    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.mag);
    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.charging_handle);
    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.bolt);
    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.rifle_no_mag);
    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.trigger_hitbox);
    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.mag_insert_hitbox);
    game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.muzzle_flush);
    for(i=0; i<game.scenes.gacha_ten.mag_guide_hitboxes.length; ++i)
        game.scenes.gacha_ten.handle.addChild(game.scenes.gacha_ten.mag_guide_hitboxes[i]);

    game.scenes.gacha_ten.handle.visible = false;

    app.stage.addChild(game.scenes.gacha_ten.handle);
    /*scene_gacha_ten*/
}

function shells_generation(gacha_rewards=[]){
    game.compute_score(gacha_rewards);
    for(var i = 0; i < gacha_rewards.length; i++){
        var shell;
        switch(gacha_rewards[i]){
            case 0: // gold
                shell = new PIXI.Sprite(game.loader.resources['./src/img/bullet_gold.svg'].texture);
                shell.is_actually_rainbow = false;
                shell.need_jump = Math.random() > 0.9 ? true : false; //fake
                break;
            case 1: // silver
                shell = new PIXI.Sprite(game.loader.resources['./src/img/bullet_silver.svg'].texture);
                shell.is_actually_rainbow = false;
                shell.need_jump = Math.random() > 0.9 ? true : false;
                break;
            case 2: // rainbow
                if(Math.random() > 0.5)
                    shell = new PIXI.Sprite(game.loader.resources['./src/img/bullet_silver.svg'].texture);
                else
                    shell = new PIXI.Sprite(game.loader.resources['./src/img/bullet_gold.svg'].texture);
                shell.is_actually_rainbow = true;
                shell.turned = false;
                shell.rainbow_bg = new PIXI.Sprite(game.loader.resources['./src/img/rainbow_bg.png'].texture);
                //shell.rainbow_bg.position.set(shell.x, shell.y);
                shell.rainbow_bg.anchor.set(0.5);
                shell.rainbow_bg.scale.set(3, 3);
                shell.rainbow_bg.alpha = 0.1;
                shell.rainbow_bg.visible = false;
                console.log(i);
                break;
        }
        shell.scale.set(0.05, 0.05);
        shell.anchor.set(0.5);
        shell.x = 412.5;
        shell.y = 187.5;

        shell.goal_x = 100 + 60 * i;
        shell.goal_y = 500;
        shell.visible = false;
        shell.velocity = [0, 0];
        if(game.state == 'gacha_single') {
            if(gacha_rewards[i]==2) game.scenes.gacha_single.handle.addChild(shell.rainbow_bg);
            game.scenes.gacha_single.handle.addChild(shell);
        }
        else if(game.state == 'gacha_ten') {
            if(gacha_rewards[i]==2) game.scenes.gacha_ten.handle.addChild(shell.rainbow_bg);
            game.scenes.gacha_ten.handle.addChild(shell);
        }
        //app.stage.addChild(shell);
        game.shells_push(shell);
    }
}

function onGachaBtnClick(event){
    sound_effects["python"].stop();
    game.scenes.start.handle.visible = false;
    app.ticker.remove(app.ticker_gameLoop, app);
    switch(event.target.gacha_num){
        case 1:
            api_gacha.post('/gacha_single')
            .then(res => {
                gacha_result = [res.data.result];
                game.loader.load(scene_1); 
                game.scenes.gacha_single.handle.visible = true;
                state = play_single;
                game.state = 'gacha_single';
                app.ticker.add(app.ticker_gameLoop, app);
            })
            .catch(err => {
                console.log(err);
            })
            break;
        case 10: 
            api_gacha.post('/gacha_ten')
            .then(res => {
                gacha_result = res.data.result;
                game.loader.load(scene_10); 
                game.scenes.gacha_ten.handle.visible = true; 
                state = play_ten; 
                game.state = 'gacha_ten';
                app.ticker.add(app.ticker_gameLoop, app);
            })
            .catch(err => {
                console.log(err);
            })
            break;
    }
}

function onDragStart(event){
    this.data = event.data;
    this.dragging = true;

    this.offX = this.x - this.data.getLocalPosition(this.parent).x;
    this.offY = this.y - this.data.getLocalPosition(this.parent).y;
}
function onDragEnd(event){
    this.dragging = false;
    this.data = null;
}

function onDragMove(){
    if(this.dragging){
        const newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x + this.offX;
        this.y = newPosition.y + this.offY;
    }
}

function onDragEnd_chargingHandle(){
    this.dragging = false;
    if(this.x < 155){
        sound_effects["bolt_forward"].play();
        
        if(game.state == 'gacha_single'){
            game.scenes.gacha_single.bolt.x = 315;
            game.scenes.gacha_single.bullet.visible = false;
            game.scenes.gacha_single.charging_handle.interactive = false;
            game.scenes.gacha_single.charging_handle.buttonMode = false;
            game.scenes.gacha_single.charging_handle.load = true;
            game.scenes.gacha_single.trigger_hitbox.interactive = true;
            game.scenes.gacha_single.trigger_hitbox.buttonMode = true;
            game.scenes.gacha_single.trigger_hitbox.on('pointerdown', onTriggerClick);
            
        }
        else if(game.state == 'gacha_ten'){
            game.scenes.gacha_ten.bolt.x = 315;
            game.scenes.gacha_ten.charging_handle.interactive = false;
            game.scenes.gacha_ten.charging_handle.buttonMode = false;
            game.scenes.gacha_ten.charging_handle.load = true;
            game.scenes.gacha_ten.trigger_hitbox.interactive = true;
            game.scenes.gacha_ten.trigger_hitbox.buttonMode = true;
            game.scenes.gacha_ten.trigger_hitbox.on('pointerdown', onTriggerClick);
        }
    this.x = 230;
    }
}

function onDragMove_chargingHandle(){
    if(this.dragging){
        const newPosition = this.data.getLocalPosition(this.parent);
        if(newPosition.x+this.offX > 150 && newPosition.x+this.offX < 230)
            this.x = newPosition.x + this.offX;
        else if(newPosition.x+this.offX < 150){
            this.x = 150;
        }
        else{
            this.x = 230;
        }
    }
}

function play_single(delta){
    // load bullets
    if(!game.scenes.gacha_single.bullet.load && b.hitTestRectangle(game.scenes.gacha_single.bullet, bolt_hitbox)){
        if(game.scenes.gacha_single.bullet.dragging == false){
            game.scenes.gacha_single.bullet.visible = true;
            game.scenes.gacha_single.bullet.load = true;
            game.scenes.gacha_single.bullet.interactive = false;
            game.scenes.gacha_single.bullet.x = 420;
            game.scenes.gacha_single.bullet.y = 205;
            game.scenes.gacha_single.bullet.rotation = 0.3;

            parent = game.scenes.gacha_single.bullet.parent;
            bullet_index = parent.children.findIndex(element => element == game.scenes.gacha_single.bullet);
            [parent.children[bullet_index-1], parent.children[bullet_index]] = [parent.children[bullet_index], parent.children[bullet_index-1]]; // swap
            // add sound
            sound_effects["single_round_loading"].play();
        }
    }
    // charging handle start
    if(game.scenes.gacha_single.bullet.load && !game.scenes.gacha_single.charging_handle.load){
        game.scenes.gacha_single.charging_handle.interactive = true;
        game.scenes.gacha_single.charging_handle.buttonMode = true;
    }
}

function play_ten(delta){
    for(i=0; i<game.scenes.gacha_ten.mag_guide_hitboxes.length; ++i){
        let collision = b.rectangleCollision(game.scenes.gacha_ten.mag, game.scenes.gacha_ten.mag_guide_hitboxes[i]);
        switch(collision){
            case "up":
                game.scenes.gacha_ten.mag.y--;
                break;
            case "down":
                game.scenes.gacha_ten.mag.y++;
                break;
            case "left":
                game.scenes.gacha_ten.mag.x++;
                break;
            case "right":
                game.scenes.gacha_ten.mag.x--;
                break;
        }
    }
    

    if(!game.scenes.gacha_ten.mag.load && b.hitTestRectangle(game.scenes.gacha_ten.mag, game.scenes.gacha_ten.mag_insert_hitbox)){
        sound_effects["put_meg_in"].play();
        game.scenes.gacha_ten.mag.load = true;
        game.scenes.gacha_ten.mag.x = 440;
        game.scenes.gacha_ten.mag.y = 290;
    }
    if(game.scenes.gacha_ten.mag.load && !game.scenes.gacha_ten.charging_handle.load){
        game.scenes.gacha_ten.mag.interactive = false;
        game.scenes.gacha_ten.mag.buttonMode = false;
        game.scenes.gacha_ten.charging_handle.interactive = true;
        game.scenes.gacha_ten.charging_handle.buttonMode = true;
    }
}

function rainbowlify(delta){ // 2434
    var container;
    if(game.state == 'gacha_single') container = game.scenes.gacha_single.handle;
    else if(game.state == 'gacha_ten') container = game.scenes.gacha_ten.handle;
    container = app.stage;
    rainbowlify_timer.global_timer++;
    var last_actually_rainbow_idx = -1;

    x_bound = [-10, 900];
    slow_motion = false;
    for(var i = 0; i < game.shells.length; i++){
        shell = game.shells[i];

        //store last actually rainbow idx
        if(i > last_actually_rainbow_idx && (shell.is_actually_rainbow || shell.need_jump)) last_actually_rainbow_idx = i;

        /*record previous position*/
        shell.x_pre = shell.x;
        shell.y_pre = shell.y;
        //start up setting
        if(((shell.is_actually_rainbow && !shell.turned) || shell.need_jump) && (rainbowlify_timer.last_rainbowlify_idx == -1 || game.shells[rainbowlify_timer.last_rainbowlify_idx].turn_finished)){
        //if(shell.is_actually_rainbow && !shell.turned && rainbowlify_timer.do_next_rainbow()){
            rainbowlify_timer.last_rainbowlify_idx = i;
            shell.turned = true;
            shell.turn_finished = false;
            shell.turned_time = rainbowlify_timer.global_timer;

            shell.velocity = [-28., 0];
            x_distance = 2 * (x_bound[1] - x_bound[0]);
            shell.air_time = x_distance / Math.abs(shell.velocity[0]);
            shell.velocity[1] = -shell.air_time * 0.5 * gravitational_acceleration;
            shell.rotation_speed = -(3.1415926*2 / shell.air_time);
            shell.original_rotation = shell.rotation;
            shell.highest_y = shell.y + shell.velocity[1] * (0.5 * shell.air_time) +
                                 0.5 * gravitational_acceleration * (0.5 * shell.air_time) * (0.5 * shell.air_time);

            break;
        }
        //loop through animation
        else if(shell.turned && !shell.turn_finished && rainbowlify_timer.global_timer > (shell.turned_time + rainbowlify_timer.DELAY_TO_RAINBOWLIFY)){
            // update the location of shells
            shell.x += rainbowlify_timer.speed * shell.velocity[0];
            shell.y += rainbowlify_timer.speed * shell.velocity[1];

            // bounce
            if(shell.x < x_bound[0]){
                shell.x = 2 * x_bound[0] - shell.x;
                shell.velocity[0] *= -1;
            }
            if(shell.x > x_bound[1]){
                shell.x = 2 * x_bound[1] - shell.x;
                shell.velocity[0] *= -1;
            }
            //change color point
            if(shell.velocity[0] > 0){
                slow_motion = true;
                let target = new Object;
                target.x = 600; 
                target.y = 300;
                if(container.scale.x < 2 && container.scale.y < 2)
                    zoom(container, shell, 1.05, target);
                else
                    zoom(container, shell, 1, target);

                /*TODO: do three position flashing*/
                let flash_start_pos = 100;
                for(let j = 0; j < 3; j++){
                    if(shell.x > flash_start_pos + j * rainbowlify_timer.DELAY_BETWEEN_FLASH
                    && shell.x < flash_start_pos + j * rainbowlify_timer.DELAY_BETWEEN_FLASH + rainbowlify_timer.flash_time
                    && !shell.flash){
                        shell.flash = new PIXI.Sprite((j == 2 && shell.is_actually_rainbow) ? game.loader.resources['./src/img/bullet_rainbow.svg'].texture : shell.texture);
                        shell.flash.anchor.set(0.5);
                        shell.flash.rotation = shell.rotation;
                        shell.flash.position.set(shell.x, shell.y);
                        shell.flash.alpha = 0.1;
                        shell.flash.scale.set(0.1, 0.1);
                        app.stage.addChild(shell.flash);
                        if(j < 2)
                            sound_effects["heart_sound"].play();
                        else if(!shell.is_actually_rainbow)
                            sound_effects["failed_rainbow"].play();
                    }
                    if(shell.x > flash_start_pos + j * rainbowlify_timer.DELAY_BETWEEN_FLASH + rainbowlify_timer.flash_time && shell.x < flash_start_pos + (j+1) * rainbowlify_timer.DELAY_BETWEEN_FLASH){
                        app.stage.removeChild(shell.flash);
                        shell.flash = null;
                    }
                    let t = shell.x - (flash_start_pos + j * rainbowlify_timer.DELAY_BETWEEN_FLASH);
                    if(shell.flash && t > 0 && t < rainbowlify_timer.flash_time){
                        shell.flash.position.set(shell.x, shell.y);
                        shell.flash.rotation = shell.rotation;

                        let alpha_threshold = [0.1, 0.7];
                        let distance = rainbowlify_timer.flash_time/2;
                        shell.flash.alpha = -Math.abs(-(alpha_threshold[1] - alpha_threshold[0]) + t*(alpha_threshold[1] - alpha_threshold[0])/distance)+alpha_threshold[1];
                    }
                }
                if(shell.is_actually_rainbow && shell.x > flash_start_pos + 2 * rainbowlify_timer.DELAY_BETWEEN_FLASH){
                    shell.texture = game.loader.resources['./src/img/bullet_rainbow.svg'].texture;
                    if(!shell.turn_2434){
                        sound_effects["2434"].play();
                        shell.turn_2434 = true;
                        shell.rainbow_bg.visible = true;
                    }
                }
            }
            // roughly the center
            //if(shell.y <= shell.highest_y + 5){
            if(shell.velocity[1] > 0 && shell.velocity[0] < 0){
                let target = new Object;
                //target.x = shell.x * container.scale.x + container.x;
                //target.y = shell.y * container.scale.y + container.y;
                target.x = shell.goal_x;
                target.y = shell.goal_y;
                if(container.scale.x > 1 && container.scale.y > 1)
                    zoom_out(container, 0.95);
                else
                    zoom_out(container, 1/container.scale.x);
            }

            // gravity
            shell.velocity[1] += rainbowlify_timer.speed * gravitational_acceleration;

            shell.rotation -= rainbowlify_timer.speed * shell.rotation_speed;

            // reset position
            if(shell.y > shell.goal_y + 10 && shell.velocity[1] > 0){
                shell.x = shell.goal_x;
                shell.y = shell.goal_y;
                shell.rotation = shell.original_rotation;
                shell.turn_finished = true;
                container.scale.set(1, 1);
                container.position.set(0, 0);
            }
        }
        if(shell.rainbow_bg && shell.rainbow_bg.visible){
            shell.rainbow_bg.position.set(shell.x, shell.y);
            shell.rainbow_bg.rotation += 0.2;
        }
    }

    if(slow_motion){
        rainbowlify_timer.speed = 0.08;
    }
    else{
        rainbowlify_timer.speed = 1.0;
    }

    if(last_actually_rainbow_idx == -1 || game.shells[last_actually_rainbow_idx].turn_finished){
        load_end_game_resources();
        state = end_game;
    }
}

function load_end_game_resources(){
    game.scenes.end_game.handle = new PIXI.Container();

    back_frame = new PIXI.Graphics();
    back_frame.beginFill(0x000000);
    back_frame.drawRect(820, 0, 500, 800);
    back_frame.endFill();
    back_frame.alpha = 0.2;
    game.scenes.end_game.handle.addChild(back_frame);

    back_btn = new PIXI.Sprite(game.loader.resources['./src/img/back.png'].texture);
    back_btn.scale.set(0.3, 0.3);
    back_btn.position.set(920, 450);
    back_btn.visible = false;
    game.scenes.end_game.back_btn = back_btn;
    game.scenes.end_game.handle.addChild(game.scenes.end_game.back_btn);
    game.scenes.end_game.back_btn.interactive = true;
    game.scenes.end_game.back_btn.buttonMode = true;
    game.scenes.end_game.back_btn
        .on('pointerdown', onBackBtnClick);

    let digits = [];
    game.scenes.end_game.score_sprites = [];
    let score = Math.floor(game.score/100000000);
    while(score != 0){
        digits.push(score % 10);
        score = Math.floor(score / 10);
    }
    for(var i = digits.length - 1; i >= 0; i--){
        var digit_sprite = new PIXI.Sprite(game.loader.resources['./src/img/number/'+digits[i]+'.png'].texture);
        digit_sprite.anchor.set(0.5);
        digit_sprite.scale.set(5, 5);
        if(digits.length == 2){
            digit_sprite.position.set(150 * (digits.length-1-i) + 900, 100);
        }
        else if(digits.length == 3){
            digit_sprite.position.set(110 * (digits.length-1-i) + 880, 100);
        }
        else if(digits.length == 1){
            digit_sprite.position.set(200 * (digits.length-1-i) + 930, 100);
        }
        digit_sprite.visible = false;
        game.scenes.end_game.score_sprites.push(digit_sprite);
        game.scenes.end_game.handle.addChild(digit_sprite);
    }
    let 億 = new PIXI.Sprite(game.loader.resources['./src/img/number/yi.png'].texture);
    億.anchor.set(0.5);
    億.scale.set(5, 5);
    if(digits.length == 2) 億.position.set(150 * digits.length + 900, 100);
    else if(digits.length == 3) 億.position.set(110 * digits.length + 880, 100);
    else if(digits.length == 1) 億.position.set(200 * digits.length + 930, 100);
    億.visible = false;
    game.scenes.end_game.score_sprites.push(億);
    game.scenes.end_game.handle.addChild(億);
    
    game.scenes.end_game.rank_sprites = [];
    if((game.shells.length == 11 && game.score > 2e9) || (game.shells.length == 1 && game.score == 3e9)){
        let S1 = new PIXI.Sprite(game.loader.resources['./src/img/S.png'].texture);
        let S2 = new PIXI.Sprite(game.loader.resources['./src/img/S.png'].texture);
        let R = new PIXI.Sprite(game.loader.resources['./src/img/R.png'].texture);
        S1.anchor.set(0.5); S1.position.set(920, 270); S1.scale.set(5, 5); S1.visible = false;
        S2.anchor.set(0.5); S2.position.set(1040, 270); S2.scale.set(5, 5); S2.visible = false;
        R.anchor.set(0.5); R.position.set(1160, 270); R.scale.set(5, 5); R.visible = false;
        game.scenes.end_game.rank_sprites.push(S1);
        game.scenes.end_game.rank_sprites.push(S2);
        game.scenes.end_game.rank_sprites.push(R);
        game.scenes.end_game.handle.addChild(S1);
        game.scenes.end_game.handle.addChild(S2);
        game.scenes.end_game.handle.addChild(R);
        if(game.score == 4.9e9){
            game.scenes.end_game.sugoi = [];
            for(let i = 29; i >= 0; i--){
                let S = new PIXI.Sprite(game.loader.resources['./src/img/S.png'].texture);
                S.anchor.set(0.5);
                S.position.set(-50 + 50 * i, 270);
                S.scale.set(5, 5);
                S.visible = false;
                game.scenes.end_game.sugoi.push(S);
                game.scenes.end_game.handle.addChild(S);
            }
        }
    }
    else if((game.shells.length == 11 && game.score > 1e9) || (game.shells.length == 1 && game.score == 4e8)){
        let S = new PIXI.Sprite(game.loader.resources['./src/img/S.png'].texture);
        let R = new PIXI.Sprite(game.loader.resources['./src/img/R.png'].texture);
        S.anchor.set(0.5); S.position.set(970, 270); S.scale.set(5, 5); S.visible = false;
        R.anchor.set(0.5); R.position.set(1120, 270); R.scale.set(5, 5); R.visible = false;
        game.scenes.end_game.rank_sprites.push(S);
        game.scenes.end_game.rank_sprites.push(R);
        game.scenes.end_game.handle.addChild(S);
        game.scenes.end_game.handle.addChild(R);
    }
    else{
        let R = new PIXI.Sprite(game.loader.resources['./src/img/R.png'].texture);
        R.anchor.set(0.5); R.position.set(1045, 270); R.scale.set(5, 5); R.visible = false;
        game.scenes.end_game.rank_sprites.push(R);
        game.scenes.end_game.handle.addChild(R);
    }

    app.stage.addChild(game.scenes.end_game.handle);
}

function end_game(delta){
    rank_timer.global_timer++;
    let scale_ratio = 0.7;
    for(let i = 0; i < game.scenes.end_game.score_sprites.length; i++){
        if(rank_timer.global_timer >= i * rank_timer.DELAY_BETWEEN_SCORE_WORD){
            if(game.scenes.end_game.score_sprites[i].visible == false) // first appear play sound
                sound_effects["item_fall"].play();
            game.scenes.end_game.score_sprites[i].visible = true;
            let scale_x = game.scenes.end_game.score_sprites[i].scale.x;
            let scale_y = game.scenes.end_game.score_sprites[i].scale.y;
            if(scale_x * scale_ratio >= 0.15 && scale_y * scale_ratio >= 0.15){
                game.scenes.end_game.score_sprites[i].scale.set(scale_x*scale_ratio, scale_y*scale_ratio);
            }
            else{
                game.scenes.end_game.score_sprites[i].scale.set(0.15, 0.15);
            }
        }
    }
    let finish_timer = game.scenes.end_game.score_sprites.length * rank_timer.DELAY_BETWEEN_SCORE_WORD + rank_timer.DELAY_BETWEEN_SCORE_RANK
    if(rank_timer.global_timer >= finish_timer){
        for(let i = 0; i < game.scenes.end_game.rank_sprites.length; i++){
            if(rank_timer.global_timer - finish_timer >= i * rank_timer.DELAY_BETWEEN_RANK_WORD){
                if(game.scenes.end_game.rank_sprites[i].visible == false) // first appear play sound
                    sound_effects["item_fall"].play();

                game.scenes.end_game.rank_sprites[i].visible = true;
                let scale_x = game.scenes.end_game.rank_sprites[i].scale.x;
                let scale_y = game.scenes.end_game.rank_sprites[i].scale.y;
                if(scale_x * scale_ratio >= 0.15 && scale_y * scale_ratio >= 0.15){
                    game.scenes.end_game.rank_sprites[i].scale.set(scale_x*scale_ratio, scale_y*scale_ratio);
                }
                else{
                    game.scenes.end_game.rank_sprites[i].scale.set(0.15, 0.15);
                }
            }
        }
    }
    finish_timer += game.scenes.end_game.rank_sprites.length * rank_timer.DELAY_BETWEEN_RANK_WORD;
    if(rank_timer.global_timer > finish_timer && game.scenes.end_game.sugoi){
        for(let i = 0; i < game.scenes.end_game.sugoi.length; i++){
            if(rank_timer.global_timer - finish_timer >= i * rank_timer.DELAY_BETWEEN_SUGOI){
                if(game.scenes.end_game.sugoi[i].visible == false){ // first appear play sound
                    sound_effects["item_fall"].play();
                    if(i == 0)
                        sound_effects["sugoi"].play();
                }

                game.scenes.end_game.sugoi[i].visible = true;
                let scale_x = game.scenes.end_game.sugoi[i].scale.x;
                let scale_y = game.scenes.end_game.sugoi[i].scale.y;
                if(scale_x * scale_ratio >= 0.15 && scale_y * scale_ratio >= 0.15){
                    game.scenes.end_game.sugoi[i].scale.set(scale_x*scale_ratio, scale_y*scale_ratio);
                }
                else{
                    game.scenes.end_game.sugoi[i].scale.set(0.15, 0.15);
                }

            }
        }
        finish_timer += game.scenes.end_game.sugoi.length * rank_timer.DELAY_BETWEEN_SUGOI;
    }
    if(rank_timer.global_timer > finish_timer){
        if(game.scenes.end_game.back_btn.visible == false)
            sound_effects["item_fall"].play();
        game.scenes.end_game.back_btn.visible = true;
    }
    for(let i = 0; i < game.shells.length; i++){
        shell = game.shells[i];
        if(shell.rainbow_bg && shell.rainbow_bg.visible){
            shell.rainbow_bg.position.set(shell.x, shell.y);
            shell.rainbow_bg.rotation += 0.2;
        }
    }

}

function gacha(delta){
    gacha_global_time++;

    if(game.state == 'gacha_single'){
        var bolt = game.scenes.gacha_single.bolt;
        var muzzle_flush = game.scenes.gacha_single.muzzle_flush;
        var target = game.scenes.gacha_single.target;
    }
    else if(game.state == 'gacha_ten'){
        var bolt = game.scenes.gacha_ten.bolt;
        var muzzle_flush = game.scenes.gacha_ten.muzzle_flush;
        var target = game.scenes.gacha_ten.target;
    }

    // handle bolt
    if(bolt.open_time > 2 && !bolt.force_open){
        bolt.x = 315; // close
    }else{
        bolt.open_time++;
    }

    // handle muzzle_flush
    if(muzzle_flush.open_time > 2){
        muzzle_flush.visible = false;
    }else{
        muzzle_flush.open_time++;
    }

    for(var i = 0; i < game.shells.length; i++){
        if(gacha_global_time > 50 * i){
            if(!game.shells[i].visible){ // new round fired
                game.shells[i].droped = false;
                game.shells[i].visible = true;
                game.shells[i].velocity = [-8, -5];

                v0 = game.shells[i].velocity[1];
                y_distance = game.shells[i].goal_y - game.shells[i].y;
                total_time = ((-4.0 * v0) + Math.pow((4.0 * v0 * v0 + 8.0 * gravitational_acceleration * y_distance), 0.5)) / (2.0 * gravitational_acceleration); // t = ( -4v0 + (4v0^2 + 8gs)^0.5 ) / 2g

                game.shells[i].velocity[0] = (game.shells[i].goal_x - game.shells[i].x) / total_time;

                sound_effects["firing"].play();

                // make bolt open
                bolt.x = 230;
                bolt.open_time = 0;

                // make muzzle_flush flush
                muzzle_flush.visible = true;
                muzzle_flush.open_time = 0;

                if(i == game.shells.length - 1){
                    bolt.force_open = true;

                    // make the mag behind everything
                    game.scenes.gacha_ten.handle.removeChild(game.scenes.gacha_ten.mag);
                    game.scenes.gacha_ten.handle.addChildAt(game.scenes.gacha_ten.mag, game.scenes.gacha_ten.handle.length);
                }
            }

            if(gacha_global_time > 50 * i + total_time - 4){
                if(game.shells[i].droped == false)
                    sound_effects["shell_drop"].play();
                game.shells[i].droped = true;
                game.shells[i].x = game.shells[i].goal_x;
                game.shells[i].y = game.shells[i].goal_y;

                game.shells[i].rotation -= 0.2 * Math.max(((50 * (i+1) + total_time + 10) - gacha_global_time) / 50, 0); // slowly stop turning

                game.shells[i].velocity = [0, 0];
            }
            else{
                // update the location of shells
                game.shells[i].x += game.shells[i].velocity[0];
                game.shells[i].y += game.shells[i].velocity[1];

                // gravity
                game.shells[i].velocity[1] += gravitational_acceleration;

                game.shells[i].rotation -= 0.15;
            }
        }
    }
    if(gacha_global_time > (game.shells.length+2) * 50){
        state = rainbowlify;
    }
}

function onTriggerClick(event){
    shells_generation(gacha_result);
    trigger_hitbox.visible = false;
    state = gacha;
}

function zoom(container, shell, scale, target){
    if(shell.x_pre && shell.y_pre){
        container.x -= container.scale.x * (shell.x * scale - shell.x_pre);
        container.y -= container.scale.y * (shell.y * scale - shell.y_pre);
        //container.x -= container.scale.x * (shell.x - old_p[0]);
        //container.y -= container.scale.y * (shell.y - old_p[1]);
        //let tx = shell.x * (container.scale.x * (scale-1));
        //let ty = shell.y * (container.scale.y * (scale-1));
        //container.x -= tx;
        //container.y -= ty;
        if(scale != 1){
            container.x += (target.x - (container.x + shell.x * container.scale.x)) * (scale - 1);
            container.y += (target.y - (container.y + shell.y * container.scale.y)) * (scale - 1);
        }
        else{
            container.x += (target.x - (container.x + shell.x * container.scale.x)) * 0.1;
            container.y += (target.y - (container.y + shell.y * container.scale.y)) * 0.1;
        }
        container.scale.x = scale * container.scale.x;
        container.scale.y = scale * container.scale.y;
    }
}

function zoom_out(container, scale){
    container.x -= container.x * scale;
    container.y -= container.y * scale;
    container.scale.x = scale * container.scale.x;
    container.scale.y = scale * container.scale.y;
}

function onBackBtnClick(event){
    app.stage.removeChild(game.scenes.start.handle);
    app.stage.removeChild(game.scenes.gacha_single.handle);
    app.stage.removeChild(game.scenes.gacha_ten.handle);
    app.stage.removeChild(game.bg);
    rainbowlify_timer.reset();
    rank_timer.reset();
    game.reset();
    gacha_global_time = 0;
    gacha_result = [];
    muzzle_flush.open_time = 0;
    state = ()=>{};
    game.loader.load(start);
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }
  