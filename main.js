const app = new PIXI.Application({
    view: document.getElementById('main'),
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    backgroundColor: 0xffffff,
});
document.body.appendChild(app.view);

const loader = app.loader;

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
}

loader
.add(resources_start)
.add(resources_charging)
.add(resources_single)
.add(resources_ten)
.add(resources_target)
.load(start);

let scene_start, scene_gacha_single, scene_gacha_ten;

let chargning_handle, bolt, bolt_open_time = 0;
let bullet, mag, mag_hitbox, mag_insert_hitbox, shells, bolt_hitbox, trigger_hitbox, state, bullet_load_count = 0, gacha_global_time = 0, gacha_result = [0, 1, 2, 2, 1, 2, 0 ,0 ,1 ,2];
let muzzle_flush, muzzle_flush_open_time = 0;
let shell_velocity = [], gravitational_acceleration = 0.9;

function start() {
    /*scene_start*/
    scene_start = new PIXI.Container();
    let gacha_popup = new PIXI.Graphics();
    gacha_popup.beginFill(0x000000);
    gacha_popup.drawRect(0, 0, 500, 500);
    gacha_popup.endFill();
    gacha_popup.x = window.innerWidth/2 - 250;
    gacha_popup.y = window.innerHeight/2 - 250;

    let gacha_single_btn = new PIXI.Sprite(loader.resources['./src/img/gacha_single.png'].texture);
    gacha_single_btn.interactive = true;
    gacha_single_btn.buttonMode = true;
    gacha_single_btn.x = window.innerWidth/2 - 200;
    gacha_single_btn.y = window.innerHeight/2 - 100;
    gacha_single_btn.gacha_num = 1;
    gacha_single_btn.on('pointerdown', onGachaBtnClick);
    let gacha_ten_btn = new PIXI.Sprite(loader.resources['./src/img/gacha_ten.png'].texture);
    gacha_ten_btn.interactive = true;
    gacha_ten_btn.buttonMode = true;
    gacha_ten_btn.x = window.innerWidth/2 + 200;
    gacha_ten_btn.y = window.innerHeight/2 - 100;
    gacha_ten_btn.gacha_num = 10;
    gacha_ten_btn.on('pointerdown', onGachaBtnClick);

    scene_start.addChild(gacha_popup);
    scene_start.addChild(gacha_single_btn);
    scene_start.addChild(gacha_ten_btn);

    app.stage.addChild(scene_start);
    /*scene_start*/
}

function scene_1(){
    /*charging handle and bolt*/
    chargning_handle = new PIXI.Sprite(loader.resources['./src/img/charging_handle.svg'].texture);
    chargning_handle.scale.set(0.1, 0.1);
    chargning_handle.x = 230;
    chargning_handle.y = 120;
    chargning_handle.interactive = false;
    chargning_handle.buttonMode = false;
    chargning_handle
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd_chargingHandle)
        .on('pointerupoutside', onDragEnd_chargingHandle)
        .on('pointermove', onDragMove_chargingHandle)

    bolt = new PIXI.Sprite(loader.resources['./src/img/bolt.svg'].texture);
    bolt.scale.set(0.1, 0.1);
    bolt.x = 230;
    bolt.y = 135;
    // close (315, 135)
    //bolt.x = 315;

    // loading muzzle flush
    muzzle_flush = new PIXI.Sprite(loader.resources['./src/img/muzzle_flush.svg'].texture);
    muzzle_flush.scale.set(0.3, 0.3);
    muzzle_flush.x = 740;
    muzzle_flush.y = 40;
    muzzle_flush.visible = false;

    /*charging handle and bolt*/
    
    /*scene_gacha_single*/
    scene_gacha_single = new PIXI.Container();
    let rifle_no_bolt = new PIXI.Sprite(loader.resources['./src/img/rifle_no_bolt.svg'].texture);
    rifle_no_bolt.scale.set(0.5, 0.5);
    let rifle = new PIXI.Sprite(loader.resources['./src/img/full_rifle.svg'].texture);
    rifle.scale.set(0.5, 0.5);

    bullet = new PIXI.Sprite(loader.resources['./src/img/bullet.svg'].texture);
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
    
    bolt_hitbox = new PIXI.Graphics();
    bolt_hitbox.beginFill(0x000000);
    bolt_hitbox.drawRect(0, 0, 75, 15);
    bolt_hitbox.endFill();
    bolt_hitbox.x = 375;
    bolt_hitbox.y = 180;
    bolt_hitbox.alpha = 0;

    trigger_hitbox = new PIXI.Graphics();
    trigger_hitbox.beginFill(0x000000);
    trigger_hitbox.drawRect(0, 0, 65, 30);
    trigger_hitbox.endFill();
    trigger_hitbox.x = 318.5;
    trigger_hitbox.y = 247.5;
    trigger_hitbox.alpha = 0;

    scene_gacha_single.addChild(rifle);
    scene_gacha_single.addChild(bolt_hitbox);
    scene_gacha_single.addChild(trigger_hitbox);
    scene_gacha_single.addChild(chargning_handle);
    scene_gacha_single.addChild(bolt);
    scene_gacha_single.addChild(rifle_no_bolt);
    scene_gacha_single.addChild(bullet);
    scene_gacha_single.addChild(muzzle_flush);
    scene_gacha_single.visible = false;

    app.stage.addChild(scene_gacha_single);
    /*scene_gacha_single*/
}

function scene_10(){
    /*charging handle and bolt*/
    chargning_handle = new PIXI.Sprite(loader.resources['./src/img/charging_handle.svg'].texture);
    chargning_handle.scale.set(0.1, 0.1);
    chargning_handle.x = 230;
    chargning_handle.y = 120;
    chargning_handle.interactive = false;
    chargning_handle.buttonMode = false;
    chargning_handle
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd_chargingHandle)
        .on('pointerupoutside', onDragEnd_chargingHandle)
        .on('pointermove', onDragMove_chargingHandle)

    bolt = new PIXI.Sprite(loader.resources['./src/img/bolt.svg'].texture);
    bolt.scale.set(0.1, 0.1);
    bolt.x = 230;
    bolt.y = 135;
    // close (315, 135)
    //bolt.x = 315;

    /*charging handle and bolt*/
    /*scene_gacha_ten*/
    scene_gacha_ten = new PIXI.Container();
    let rifle_no_mag = new PIXI.Sprite(loader.resources['./src/img/rifle_no_mag.svg'].texture);
    rifle_no_mag.scale.set(0.5, 0.5);

    mag = new PIXI.Sprite(loader.resources['./src/img/mag.svg'].texture);
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

    mag_insert_hitbox = new PIXI.Graphics();
    mag_insert_hitbox.beginFill(0x000000);
    mag_insert_hitbox.drawRect(0,0,30,30);
    mag_insert_hitbox.endFill();
    mag_insert_hitbox.x = 390;
    mag_insert_hitbox.y = 180;
    mag_insert_hitbox.alpha = 0;

    trigger_hitbox = new PIXI.Graphics();
    trigger_hitbox.beginFill(0x000000);
    trigger_hitbox.drawRect(0, 0, 65, 30);
    trigger_hitbox.endFill();
    trigger_hitbox.x = 318.5;
    trigger_hitbox.y = 247.5;
    trigger_hitbox.alpha = 0;

    scene_gacha_ten.addChild(mag);
    scene_gacha_ten.addChild(chargning_handle);
    scene_gacha_ten.addChild(rifle_no_mag);
    scene_gacha_ten.addChild(trigger_hitbox);
    scene_gacha_ten.addChild(mag_insert_hitbox);
    scene_gacha_ten.addChild(bolt);
    scene_gacha_ten.visible = false;

    app.stage.addChild(scene_gacha_ten);
    /*scene_gacha_ten*/
}

function shells_generation(gacha_rewards=[]){
    shells = [];
    var shell;
    for(var i = 0; i < gacha_rewards.length; i++){
        switch(gacha_rewards[i]){
            case 0: shell = new PIXI.Sprite(loader.resources['./src/img/bullet_gold.svg'].texture); break;
            case 1: shell = new PIXI.Sprite(loader.resources['./src/img/bullet_silver.svg'].texture); break;
            case 2: shell = new PIXI.Sprite(loader.resources['./src/img/bullet_rainbow.svg'].texture); break;
        }
        shell.scale.set(0.05, 0.05);
        shell.anchor.set(0.5);
        shell.x = 412.5;
        shell.y = 187.5;
        shell.visible = false;
        app.stage.addChild(shell);
        shells.push(shell);
        shell_velocity.push([0, 0]);
    }
}

function onGachaBtnClick(event){
    scene_start.visible = false;
    app.ticker.add(delta => gameLoop(delta));
    switch(event.target.gacha_num){
        case 1: 
            loader.load(scene_1); 
            scene_gacha_single.visible = true; 
            state = play_single; 
            break;
        case 10: 
            loader.load(scene_10); 
            scene_gacha_ten.visible = true; 
            state = play_ten; 
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
        bolt.x = 315;
        bullet.visible = false;
        chargning_handle.interactive = false;
        chargning_handle.buttonMode = false;
        trigger_hitbox.interactive = true;
        trigger_hitbox.buttonMode = true;
        trigger_hitbox.on('pointerdown', onTriggerClick);
    }
    this.x = 230;
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

function gameLoop(delta){
    state(delta);
}

function play_single(delta){
    // load bullets
    if(!bullet.load && hitTestRectangle(bullet, bolt_hitbox)){
        if(bullet.dragging == false){
            bullet.visible = true;
            bullet.load = true;
            bullet.interactive = false;
            bullet.x = 420;
            bullet.y = 205;
            bullet.rotation = 0.3;

            parent = bullet.parent;
            bullet_index = parent.children.findIndex(element => element == bullet);
            [parent.children[bullet_index-1], parent.children[bullet_index]] = [parent.children[bullet_index], parent.children[bullet_index-1]]; // swap

            bullet_load_count++;
            // add sound
            sound_effects["single_round_loading"].play();
        }
    }
    // trigger start
    if(bullet_load_count == 1){
        chargning_handle.interactive = true;
        chargning_handle.buttonMode = true;
    }
}

function play_ten(delta){
    if(!mag.load && hitTestRectangle(mag, mag_insert_hitbox)){
        console.log("test");
        if(mag.dragging == false){
            mag.load = true;
            mag.x = 440;
            mag.y = 290;
        }
    }
    if(mag.load){
        mag.interactive = false;
        mag.buttonMode = false;
        chargning_handle.interactive = true;
        chargning_handle.buttonMode = true;
    }
}

function gacha(delta){
    gacha_global_time++;

    // handle bolt
    if(bolt_open_time > 2){
        bolt.x = 315; // close
    }else{
        bolt_open_time++;
    }

    // handle muzzle_flush
    if(muzzle_flush_open_time > 2){
        muzzle_flush.visible = false;
    }else{
        muzzle_flush_open_time++;
    }

    for(var i = 0; i < shells.length; i++){
        if(gacha_global_time > 20 * i){
            if(!shells[i].visible){ // new round fired
                shells[i].visible = true;
                shell_velocity[i] = [-8, -5];

                sound_effects["firing"].play();

                // make bolt open
                bolt.x = 230;
                bolt_open_time = 0;

                // make muzzle_flush flush
                muzzle_flush.visible = true;
                muzzle_flush_open_time = 0;
            }
            
            // update the location of shells
            shells[i].x += shell_velocity[i][0];
            shells[i].y += shell_velocity[i][1];

            // gravity
            shell_velocity[i][1] += gravitational_acceleration;

            shells[i].rotation -= 0.1;
        }
    }
}

function hitTestRectangle(r1, r2) {
  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2 - (r1.anchor ? r1.anchor.x * r1.width : 0);
  r1.centerY = r1.y + r1.height / 2 - (r1.anchor ? r1.anchor.y * r1.height : 0);
  r2.centerX = r2.x + r2.width / 2 - (r2.anchor ? r2.anchor.x * r2.width : 0);
  r2.centerY = r2.y + r2.height / 2 - (r2.anchor ? r2.anchor.y * r2.height : 0);

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
}

function onTriggerClick(event){
    console.log('test');
    shells_generation(gacha_result);
    trigger_hitbox.visible = false;
    state = gacha;
}