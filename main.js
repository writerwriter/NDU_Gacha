const app = new PIXI.Application({
    view: document.getElementById('main'),
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    backgroundColor: 0xffffff,
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
        this._shells = [];
        this._shell_velocity = [];
        this._state = 'start';
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

    reset() {
        this.scenes.start = new Object();
        this.scenes.gacha_single = new Object();
        this.scenes.gacha_ten = new Object();

        this.scenes.start.handle = null;
        this.scenes.start.gacha_popup = null;
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

        this.scenes.gacha_ten.mag_guide_hitboxes = [];

        this.shells = [];

        this.state = 'start';
    }

    shells_push(value) {
        this.shells.push(value);
    }

    shell_velocity_push(value) {
        this.shell_velocity.push(value);
    }
}


var game = new Game(app.loader);
//var loader = app.loader;

const resources_start = [
    "./src/img/gacha_single.png",
    "./src/img/gacha_ten.png",
]

const resources_charging = [
    "./src/img/charging_handle.svg",
    "./src/img/bolt.svg",
]

const resources_single = [
    "./src/img/rifle_no_bolt.svg", 
    "./src/img/full_rifle.svg", 
    "./src/img/bullet_gold.svg",
    "./src/img/bullet_silver.svg",
    "./src/img/bullet_rainbow.svg",
    "./src/img/bullet.svg",
    "./src/img/muzzle_flush.svg"
]

const resources_ten = ["./src/img/rifle_no_mag.svg",
    "./src/img/mag.svg",
    "./src/img/rifle_no_mag_with_bolt.svg"
]

const resources_target = [
    "./src/img/target.jpg"
]

const sound_effects = {
    "single_round_loading": PIXI.sound.Sound.from("./src/sound/single round loading.mp3"),
    "firing": PIXI.sound.Sound.from("./src/sound/firing.mp3"),
    "python": PIXI.sound.Sound.from("./src/sound/python_sound.mp3"),
    "bolt_forward": PIXI.sound.Sound.from("./src/sound/bolt_forward.mp3"),
    "put_meg_in": PIXI.sound.Sound.from("./src/sound/put_meg_in.mp3"),
}

game.loader
.add(resources_start)
.add(resources_charging)
.add(resources_single)
.add(resources_ten)
.add(resources_target)
.load(start);

app.ticker_gameLoop = function(delta){
    state(delta);
}

let state, gacha_global_time = 0, gacha_result = [0, 1, 2, 2, 1, 2, 0 ,0 ,1 ,2]; // TODO: post gpu4.miplab.org:8999
let muzzle_flush_open_time = 0;         // TODO: move this in the object
let gravitational_acceleration = 0.9;   // TODO: turn this into constant

function start() {
    /*scene_start*/
    game.scenes.start.handle = new PIXI.Container();
    let gacha_popup = new PIXI.Graphics();
    gacha_popup.beginFill(0x000000);
    gacha_popup.drawRect(0, 0, 500, 500);
    gacha_popup.endFill();
    gacha_popup.x = window.innerWidth/2 - 250;
    gacha_popup.y = window.innerHeight/2 - 250;
    game.scenes.start.gacha_popup = gacha_popup;

    // TODO: change layout
    let gacha_single_btn = new PIXI.Sprite(game.loader.resources['./src/img/gacha_single.png'].texture);
    gacha_single_btn.interactive = true;
    gacha_single_btn.buttonMode = true;
    gacha_single_btn.x = window.innerWidth/2 - 200;
    gacha_single_btn.y = window.innerHeight/2 - 100;
    gacha_single_btn.gacha_num = 1;
    gacha_single_btn.on('pointerdown', onGachaBtnClick);
    game.scenes.start.gacha_single_btn = gacha_single_btn;

    let gacha_ten_btn = new PIXI.Sprite(game.loader.resources['./src/img/gacha_ten.png'].texture);
    gacha_ten_btn.interactive = true;
    gacha_ten_btn.buttonMode = true;
    gacha_ten_btn.x = window.innerWidth/2 + 200;
    gacha_ten_btn.y = window.innerHeight/2 - 100;
    gacha_ten_btn.gacha_num = 10;
    gacha_ten_btn.on('pointerdown', onGachaBtnClick);
    game.scenes.start.gacha_ten_btn = gacha_ten_btn;

    game.scenes.start.gacha_ten_btn.mouseover = game.scenes.start.gacha_single_btn.mouseover = function(){ sound_effects["python"].play(); };
    game.scenes.start.gacha_ten_btn.mouseout = game.scenes.start.gacha_single_btn.mouseout = function(){ sound_effects["python"].stop(); };

    game.scenes.start.handle.addChild(game.scenes.start.gacha_popup);
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
    bullet.x = 100;
    bullet.y = 50;
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
    mag.x = 600;
    mag.y = 600;
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
    for(var i = 0; i < gacha_rewards.length; i++){
        var shell;
        switch(gacha_rewards[i]){
            case 0:
                shell = new PIXI.Sprite(game.loader.resources['./src/img/bullet_gold.svg'].texture);
                break;
            case 1:
                shell = new PIXI.Sprite(game.loader.resources['./src/img/bullet_silver.svg'].texture);
                break;
            case 2:
                shell = new PIXI.Sprite(game.loader.resources['./src/img/bullet_rainbow.svg'].texture);
                break;
        }
        shell.scale.set(0.05, 0.05);
        shell.anchor.set(0.5);
        shell.x = 412.5;
        shell.y = 187.5;

        shell.goal_x = 100 + 60 * i;
        shell.goal_y = 500;
        shell.visible = false;
        app.stage.addChild(shell);
        game.shells_push(shell);
        game.shell_velocity_push([0, 0]);
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

function gacha(delta){
    gacha_global_time++;

    if(game.state == 'gacha_single'){
        var bolt = game.scenes.gacha_single.bolt;
        var muzzle_flush = game.scenes.gacha_single.muzzle_flush;
    }
    else if(game.state == 'gacha_ten'){
        var bolt = game.scenes.gacha_ten.bolt;
        var muzzle_flush = game.scenes.gacha_ten.muzzle_flush;
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

    // TODO: turn 2434
    for(var i = 0; i < game.shells.length; i++){
        if(gacha_global_time > 20 * i){
            if(!game.shells[i].visible){ // new round fired
                game.shells[i].visible = true;
                game.shell_velocity[i] = [-8, -5];

                v0 = game.shell_velocity[i][1];
                y_distance = game.shells[i].goal_y - game.shells[i].y;
                total_time = ((-4.0 * v0) + Math.pow((4.0 * v0 * v0 + 8.0 * gravitational_acceleration * y_distance), 0.5)) / (2.0 * gravitational_acceleration); // t = ( -4v0 + (4v0^2 + 8gs)^0.5 ) / 2g

                game.shell_velocity[i][0] = (game.shells[i].goal_x - game.shells[i].x) / total_time;

                sound_effects["firing"].play();

                // make bolt open
                bolt.x = 230;
                bolt.open_time = 0;

                // make muzzle_flush flush
                muzzle_flush.visible = true;
                muzzle_flush.open_time = 0;

                if(i == game.shells.length - 1)
                    bolt.force_open = true;
            }

            if(gacha_global_time > 20 * i + total_time - 4){
                game.shells[i].x = game.shells[i].goal_x;
                game.shells[i].y = game.shells[i].goal_y;

                game.shells[i].rotation -= 0.3 * Math.max(((20 * (i+1) + total_time + 10) - gacha_global_time) / 20, 0); // slowly stop turning
            }
            else{
                // update the location of shells
                game.shells[i].x += game.shell_velocity[i][0];
                game.shells[i].y += game.shell_velocity[i][1];

                // gravity
                game.shell_velocity[i][1] += gravitational_acceleration;

                game.shells[i].rotation -= 0.15;
            }
        }
    }
    if(gacha_global_time > 500){
        for(i=0; i<game.shells.length; i++){
            game.shells[i].visible = false;
        }

        if(game.scenes.gacha_single.handle) game.scenes.gacha_single.handle.visible = false;
        if(game.scenes.gacha_ten.handle) game.scenes.gacha_ten.handle.visible = false;
        state = ()=>{};

        game.reset();

        gacha_global_time = 0;
        gacha_result = [0, 1, 2, 2, 1, 2, 0 ,0 ,1 ,2];
        muzzle_flush.open_time = 0;
        game.loader.load(start);        
    }
}

function onTriggerClick(event){
    shells_generation(gacha_result);
    trigger_hitbox.visible = false;
    state = gacha;
}