var DeerHuhn = function (canvasContainerId) {    
    // canvas & dimensions
    this.MAX_HEIGHT=DeerHuhn.SCENE_HEIGHT;
    this.GAME_CONTAINER = document.getElementById(canvasContainerId);
    this.rendererWidth = this.GAME_CONTAINER.offsetWidth - 8;
    this.rendererHeight = Math.min(this.GAME_CONTAINER.offsetHeight - 8, this.MAX_HEIGHT);
    this.renderingScale = this.rendererHeight/this.MAX_HEIGHT;
    this.MAX_AMMO = 5;
    this.animalKindFrequency = {
        Liska: 10,
        AutoCervene: 20,
        AutoModre: 30,
        KachnaPlove: 50,
        Kachna: 20,
        LKT: 100,
        LKTWithKlady: 100,
        Odvozka: 150,
        Ovce: 30,
        Prase: 30,
        Vlacek: 100,
        Sele: 20,
        Srna: 40,
        Kvitko: 40,
        VykukujiciSrnec: 90
    };

    // scrolling
    // whether the background is scrolling; 0: no scrolling; -1: scrolling left; 1: scrolling right
    this.scrollingDirection = 0;
    // scrolling direction given by mouse; gets overridden by keyboard
    this.scrollingDirectionByMouse = 0;
    // how much is the background scrolled from the left (in the overall percentage of possible scroll)
    this.scrollPercentage = 0.0;
    this.SCROLL_PERCENTAGE_STEP_PER_SECOND = 35/100.0;

    // renderer setup
    var interactive = true;
    this.stage = new PIXI.ScalableStage(0xAAFFFF, interactive);
    this.stage.name = 'Stage';
    this.renderer = PIXI.autoDetectRenderer(this.rendererWidth, this.rendererHeight);
    this.GAME_CONTAINER.appendChild(this.renderer.view);

    this.useWebGl = (this.renderer instanceof PIXI.WebGLRenderer);

    var dateChangeCallback = function () {
        this.updateDate();
        this.updateDontShootSigns();
    }.bind(this);

    var gameOverCallback = function () {
        console.log('Game over!'); //TODO development code
    }.bind(this);

    /**
     * The time of the game.
     *
     * @property
     *
     * @public
     * @readonly
     * @type {DeerHuhn.GameTime}
     */
    this.gameTime = new DeerHuhn.GameTime(dateChangeCallback, gameOverCallback);

    this.points = 0;

    // the number of ammunition available
    this.ammo = this.MAX_AMMO;
    // true if the ammo is reloading (cannot shoot)
    this.reloadingAmmo = false;

    // pausing
    this.isPaused = false;
    this.pauseStartTime = null;
    this.pausableObjects = [this.gameTime];
    /** The timer managing the timeout when unpausing. */
    this.unPauseCountdownTimer = null;
    this.unPauseCountdownDigits = [];

    // objects that need position updates via updatePosition(timeDelta) calls
    this.movingObjects = [];

    // sound
    this.sounds = {};

    // fps
    this.lastAnimationFrameTime = null;
    this.fps = 0;

    // HUD
    this.dateText = null;
    this.pointsText = null;
    this.bulletSprites = [];
    this.noAmmoSprite = null;

    // variables filled after the assets are loaded
    this.backgroundLayers = [];
    this.sprites = [];
    // All animals currently living in the game. Initialized in DeerHuhn.initAnimals().
    this.animals = [];

    // factory for animals
    this.animalFactory = new DeerHuhn.Animals.AnimalFactory();

    // window callbacks
    window.onresize = this.resize.bind(this);
    window.onorientationchange = this.resize.bind(this);
    window.onblur = window.onfocusout = window.onpagehide = this.blur.bind(this);
    window.onfocus = window.onfocusin = window.onpageshow = this.focus.bind(this);

    var visibilityChangedCallback = function (hidden) {
        if (document[hidden])
            this.blur();
        else
            this.focus();
    }.bind(this);
    // HTML5 visibility API
    // http://stackoverflow.com/questions/1060008/is-there-a-way-to-detect-if-a-browser-window-is-not-currently-active
    var hidden = "hidden";
    if (hidden in document)
        document.addEventListener("visibilitychange", visibilityChangedCallback.bind(hidden));
    else if ((hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", visibilityChangedCallback.bind(hidden));
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", visibilityChangedCallback.bind(hidden));
    else if ((hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", visibilityChangedCallback.bind(hidden));
    else
        hidden = null;

    // if the window isn't active at startup, pause the game
    if (hidden !== null && document[hidden])
        this.blur();

    addEvent(this.renderer.view, 'mousemove', this.mousemove.bind(this), true);

    // disable right-click menu
    addEvent(this.renderer.view, 'contextmenu', function (evt) {
        evt.preventDefault();
        return false;
    });

    // right-click for reloading
    this.stage.click = function (mouse) {
        if (this.isPaused)
            return;

        var evt = mouse.originalEvent;
        if ("which" in evt)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRight = evt.which == 3; 
        else if ("button" in evt)  // IE, Opera 
            isRight = evt.button == 2;

        if (!isRight)
            return true;

        this.reloadAmmo();
        return false; // stop event bubbling
    }.bind(this);

    // other init
    PIXI.Keys.init();
};

DeerHuhn.SCENE_HEIGHT = 960;
DeerHuhn.BASIC_ANIMAL_SCALE = DeerHuhn.SCENE_HEIGHT * 1.0 / 1937;

DeerHuhn.prototype = {

    scrollBackground: function()
    {
        if (this.scrollingDirection === 0)
            return;

        this.scrollPercentage = Math.max(0, Math.min(1, 
            this.scrollPercentage - this.scrollingDirection*this.SCROLL_PERCENTAGE_STEP_PER_SECOND/this.fps));

        for (var i = 0; i < this.backgroundLayers.length; i++) {
            var layer = this.backgroundLayers[i];
            layer.position.x = this.scrollPercentage * (-layer.width + this.rendererWidth / this.renderingScale);
        }
    },

    animate: function(forceEvenIfPaused) {
        if ((forceEvenIfPaused === undefined || forceEvenIfPaused === false) && this.isPaused)
            return;

        if (!this.isPaused) {
            var timeDelta = this.calculateTimeDelta(new Date());
            this.fps = this.calculateFps(timeDelta);

            this.processKeys();

            this.scrollBackground();

            this.updateMovingObjects(timeDelta);
        }

        this.renderer.render(this.stage);

        if (!this.isPaused)
            requestAnimFrame(this.animate.bind(this));
    },

    calculateTimeDelta: function(now) {
        var timeDelta;

        if (this.lastAnimationFrameTime === null) {
            this.lastAnimationFrameTime = now;
            return 0;
        }

        timeDelta = now.valueOf() - this.lastAnimationFrameTime.valueOf();
        this.lastAnimationFrameTime = now;

        return timeDelta; 
    },

    calculateFps: function(timeDelta) {
        if (timeDelta === 0) {
            return 60;
        }

        return 1000 / timeDelta;
    },

    processKeys: function() {
        if (PIXI.Keys.isKeyPressed(PIXI.Keys.keyCodes.left)) {
            this.scrollingDirection = 1;
        } else if (PIXI.Keys.isKeyPressed(PIXI.Keys.keyCodes.right)) {
            this.scrollingDirection = -1;
        } else {
            // if not scrolling by keyboard, try to scroll by mouse
            this.scrollingDirection = this.scrollingDirectionByMouse;
        }
    },

    mousemove: function(e) {
        if (e.clientX / this.rendererWidth < 0.1) {
            this.scrollingDirectionByMouse = 1 + (1 - (e.clientX / this.rendererWidth / 0.1));
        } else if (e.clientX / this.rendererWidth > 0.9) {
            this.scrollingDirectionByMouse = -1 - (1 - ((1 - e.clientX / this.rendererWidth) / 0.1));
        } else {
            this.scrollingDirectionByMouse = 0;
        }
    },

    onLoad: function() {
        var layerClick = function (mouse) {
            if (this.isPaused)
                return;

            var evt = mouse.originalEvent;
            if ("which" in evt)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                isLeft = evt.which == 1; 
            else if ("button" in evt)  // IE, Opera 
                isLeft = evt.button == 1;

            if (!isLeft)
                return true;

            if (this.canShoot()) {
                this.shoot();
            } else {
                this.sounds.noAmmo.play();
            }

            console.log('Clicked layer ' + mouse.target.name);
            return false; // stop event bubbling
        };

        // init background tiles
        for (var i = 5; i >= 0; i--) {
            this.backgroundLayers[i] = PIXI.Sprite.fromImage('images/vrstva'+i+'.png');
            this.backgroundLayers[i].name = 'Background ' + i;
            this.backgroundLayers[i].position.x = 0;

            // make the background layers clickable through the transparent areas
            var useWebGL = (this.renderer instanceof PIXI.WebGLRenderer);
            this.backgroundLayers[i].hitArea = PIXI.TransparencyHitArea.create(this.backgroundLayers[i], useWebGL);

            // this is needed for the background to stop bubbling of click events
            this.backgroundLayers[i].setInteractive(true);

            // TODO development code
            var layer = this;
            this.backgroundLayers[i].click = layerClick.bind(this);

            this.addSprite(this.backgroundLayers[i]);
            this.stage.addChild(this.backgroundLayers[i]);
        }

        // add the false background in foreground (for displaying points above all layers)
        for (var i=11; i >= 6; i--) {
            this.backgroundLayers[i] = new PIXI.DisplayObjectContainer();
            this.backgroundLayers[i].name = "False background " + (i-6);
            this.backgroundLayers[i].width = this.backgroundLayers[i-6].width;
            this.backgroundLayers[i].height = this.backgroundLayers[i-6].height;
            this.stage.addChild(this.backgroundLayers[i]);
        }

        // init animations
        for (var textureId in PIXI.TextureCache) {
            if (PIXI.TextureCache.hasOwnProperty(textureId)) {
                // name pattern is animation-frameBaseName-positionInAnimation.png
                // frameBaseName cannot contain "-"
                var idParts = textureId.split('-');
                if (idParts[0] === 'animation' && idParts.length == 3) {
                    var frameBaseName = idParts[1];

                    // remove the ".png" suffix from position argument
                    var positionInAnimationWithoutFileExtension = idParts[2].substr(0, idParts[2].length-4);
                    var positionInAnimation = parseInt(positionInAnimationWithoutFileExtension);

                    if (DeerHuhn.Animals.animationTexturesCache[frameBaseName] === undefined)
                        DeerHuhn.Animals.animationTexturesCache[frameBaseName] = [];

                    DeerHuhn.Animals.animationTexturesCache[frameBaseName][positionInAnimation] = PIXI.TextureCache[textureId];
                }
            }
        }

        this.initHUD();

        this.initSounds();

        this.initAnimals();

        this.resize();

        // needed for the scale to propagate to the text size
        this.updateDate();
        this.updatePoints();

        this.gameTime.start();
        requestAnimFrame(this.animate.bind(this));
    },

    addSprite: function(sprite) {
        this.sprites.push(sprite);

        if ('unPause' in sprite) {
            this.pausableObjects.push(sprite);
        }
    },

    removeSprite: function(sprite) {
        this.sprites.remove(sprite);

        if ('unPause' in sprite)
            this.pausableObjects.remove(sprite);
    },

    initHUD: function() {
        var ignoreClicksCallback = function () {
            return false;
        };

        var pointsDate = new PIXI.Sprite(PIXI.TextureCache['datum_body.png']);
        pointsDate.scale.x = pointsDate.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
        pointsDate.interactive = true;
        pointsDate.click = ignoreClicksCallback;
        pointsDate.onresize = function () {
            pointsDate.position.x = 0.99*this.rendererWidth/this.renderingScale - pointsDate.width;
            pointsDate.position.y = 0.99*this.rendererHeight/this.renderingScale - pointsDate.height;
        }.bind(this);

        this.addSprite(pointsDate);
        this.stage.addChild(pointsDate);

        // date
        
        this.dateText = new PIXI.Text(' 1. 3.', {font: '120px HelveticaLight', fill: '#8E8D5B'});
        // set the position
        this.updateDate();

        this.addSprite(this.dateText);
        pointsDate.addChild(this.dateText);

        // points
        
        this.pointsText = new PIXI.Text('0', {font: 'bold 120px HelveticaBlack'});
        // set the position
        this.updatePoints();

        this.addSprite(this.pointsText);
        pointsDate.addChild(this.pointsText);

        // ammo

        var ammoResize = function (bullet, i) {
            bullet.position.x = 0.99*this.rendererWidth/this.renderingScale - 1.1*pointsDate.width - (i+1)*(1.1*bullet.width);
            bullet.position.y = 0.99*this.rendererHeight/this.renderingScale - bullet.height;
        }.bind(this);

        for (var i=0; i < this.MAX_AMMO; i++) {
            var bullet = new PIXI.Sprite(PIXI.TextureCache['naboj.png']);
            bullet.scale.x = bullet.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
            bullet.interactive = true;
            bullet.click = ignoreClicksCallback;
            bullet.onresize = ammoResize.bind(null, bullet, i);

            this.addSprite(bullet);
            this.stage.addChild(bullet);
            this.bulletSprites[i] = bullet;
        }

        var noAmmo = new PIXI.Sprite(PIXI.TextureCache['naboje-zadne.png']);
        noAmmo.interactive = true;
        noAmmo.click = ignoreClicksCallback;
        noAmmo.onresize = ammoResize.bind(null, noAmmo, 0);

        this.addSprite(noAmmo);
        this.stage.addChild(noAmmo);
        this.noAmmoSprite = noAmmo;

        this.updateAmmo();

        // "situations" - what is allowed to shoot at
        
        var allowedShooting = new PIXI.Sprite(PIXI.TextureCache['situace.png']);
        allowedShooting.interactive = false;
        allowedShooting.onresize = function () {
            allowedShooting.position.x = 0.99*this.rendererWidth/this.renderingScale - allowedShooting.width;
            allowedShooting.position.y = 0.01*this.rendererHeight/this.renderingScale;
        }.bind(this);

        this.addSprite(allowedShooting);
        this.stage.addChild(allowedShooting);

        // sele and liska can always be shot
        var animalKinds = ['Ovce', 'Kachna', 'Prase', 'Srna'/*, 'Sele', 'Liska'*/];
        var signPositionsX = [28, 165, 305, 469];

        this.dontShootSigns = {};
        for (var i=0; i < animalKinds.length; i++) {
            var animalKind = animalKinds[i];
            var sign = new PIXI.Sprite(PIXI.TextureCache['naboje-zadne.png']);

            sign.scale.x = sign.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
            sign.position.x = signPositionsX[i];
            sign.position.y = 25;

            this.addSprite(sign);
            allowedShooting.addChild(sign);
            this.dontShootSigns[animalKind] = sign;
        }

        // unpausing countdown digits
        
        var numCountDownDigits = 3;
        var countDownDigitOnResize = function (i) {
            var digit = this.unPauseCountdownDigits[i];
            digit.position.x = 0.5*this.rendererWidth/this.renderingScale - digit.width/2;
            digit.position.y = 0.5*this.rendererHeight/this.renderingScale - digit.height/2;
        }.bind(this);

        for (var i=0; i<numCountDownDigits; i++) {
            var digit = new PIXI.Text((numCountDownDigits-i)+'', {font: '240px HelveticaLight', fill: '#8E8D5B'});
            digit.visible = false;
            
            digit.onresize = countDownDigitOnResize.bind(this, i);

            this.unPauseCountdownDigits.push(digit);
            this.addSprite(digit);
            this.stage.addChild(digit);
        }

        //TODO add music and sound muting
    },

    updateDate: function () {
        var day = this.gameTime.getDay() + '.';
        if (day.length == 2)
            day = ' ' + day;

        var month = this.gameTime.getMonth() + '.';
        if (month.length == 2)
            month = ' ' + month;

        this.dateText.setText(day + month);
        this.dateText.updateText();

        this.dateText.position.x = 300 - this.dateText.width;
        this.dateText.position.y = 250 - this.dateText.height;
    },

    updatePoints: function () {
        var style = this.pointsText.style;
        if (this.points >= 0)
            style.fill = '#8E8D5B';
        else
            style.fill = '#FF0000';

        this.pointsText.setStyle(style);
        this.pointsText.setText(this.points + '');
        this.pointsText.updateText();

        this.pointsText.position.x = 560 - this.pointsText.width/2;
        this.pointsText.position.y = 260 - this.pointsText.height;
    },

    updateAmmo: function() {
        this.noAmmoSprite.visible = this.ammo === 0;
        for (var i=0; i<this.bulletSprites.length; i++)
            this.bulletSprites[i].visible = this.ammo >= (i+1);
    },

    updateDontShootSigns: function() {
        for (var animalKind in this.dontShootSigns) {
            var canShootAnimal = DeerHuhn.Animals[animalKind].getStaticScore.call(null, this.gameTime) > 0;
            this.dontShootSigns[animalKind].visible = !canShootAnimal;
        }
    },

    initSounds: function() {
        this.sounds.mainTheme = new DeerHuhn.SingletonSoundSample({
            urls: this.getSoundFiles('sound/les_opt'),
            autoplay: true,
            loop: true,
            volume: 1
        });

        this.sounds.shot = new DeerHuhn.SoundSample({
            urls: this.getSoundFiles('sound/vystrel_opt'),
            volume: 1
        });

        this.sounds.noAmmo = new DeerHuhn.SoundSample({
            urls: this.getSoundFiles('sound/prazdno_opt'),
            volume: 1
        });

        this.sounds.reload = new DeerHuhn.SoundSample({
            urls: this.getSoundFiles('sound/nabit_opt'),
            volume: 1
        });
        
        for (var sound in this.sounds)
            this.pausableObjects.push(this.sounds[sound]);
    },

    getSoundFiles: function (baseName) {
        return [baseName + '.ogg', baseName + '.mp4', baseName + '.webm', baseName + '.mp3'];
    },

    initAnimals: function() {
        this.animalOnShotCallback = function(animal) {
            if (!(this instanceof DeerHuhn))
                throw new Error('Wrong type of this in callback');

            if (!(animal instanceof DeerHuhn.ShootableObject))
                throw new Error('Wrong type of animal in callback');

            if (!this.canShoot()) {
                console.log('no ammo -> cannot shoot');
                this.sounds.noAmmo.play();
                return false;
            }

            var points = animal.getScore(this.gameTime);

            //TODO development code
            console.log(animal.name + ' killed, ' + points + ' points');
            
            this.points += points;
            this.updatePoints();
            this.shoot();

            // show the smoke cloud
            var smokeSprite = new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.vystrel);
            var smoke = new DeerHuhn.AnimatedObject(smokeSprite, function () {}, 2);
            smokeSprite.setInteractive(false);

            var layer = this.backgroundLayers[animal.scenePosition.layer];
            layer.addChild(smoke.sprite);
            this.addSprite(smoke.sprite);
            this.pausableObjects.push(smoke);
            smoke.sprite.position = animal.sprite.position.clone();

            var smokeTimer = new DeerHuhn.PausableTimeout(function () {
                layer.removeChild(smoke.sprite);
                this.removeSprite(smoke.sprite);
                this.pausableObjects.remove(smokeTimer);
            }.bind(this), 1000);
            this.pausableObjects.push(smokeTimer);
            smokeTimer.start();

            // show the fading score
            var falseLayer = this.backgroundLayers[animal.scenePosition.layer + 6];
            var fadingPoints = new DeerHuhn.FadingPoints(points, 1000, animal.scenePosition, function () {
                this.removeSprite(fadingPoints.sprite);
                falseLayer.removeChild(fadingPoints.sprite);
            }.bind(this), this);
            this.addSprite(fadingPoints.sprite);
            falseLayer.addChild(fadingPoints.sprite);

            if (animal.movementFinishedCallback !== undefined)
                animal.movementFinishedCallback(animal);

            return true;
        }.bind(this); 

        this.animalMovementFinishedCallback = function(animal) {
            if (!(this instanceof DeerHuhn))
                throw new Error('Bad type of this in callback.');

            if (!(animal instanceof DeerHuhn.ShootableObject))
                throw new Error('Bad type of animal in callback.');

            this.removeAnimal(animal);
        }.bind(this);

        this.staticObjectOnShotCallback = function(animal) {
            if (this.animalOnShotCallback.call(this, animal)) {
                // the shot succeeded (enough ammo...)
                this.animalMovementFinishedCallback.call(this, animal);
            }
        }.bind(this);

        // add one-time static shootable objects
        this.addAnimal(this.animalFactory.createBudka(this.staticObjectOnShotCallback));

        var numDeadTrees = randInt(0, 3);
        for (var i=0; i < numDeadTrees; i++) {
            this.addAnimal(this.animalFactory.createSouska(this.staticObjectOnShotCallback));
        }

        this.addAnimal(this.animalFactory.createVetev(this.staticObjectOnShotCallback));

        var numMushrooms = randInt(0, 3);
        for (var i=0; i < numMushrooms; i++) {
            this.addAnimal(this.animalFactory.createChoros(this.staticObjectOnShotCallback));
        }

        // spawn every day
        var spawnTimer = new DeerHuhn.PausableInterval(this.spawnRandomAnimals.bind(this), 600);
        this.pausableObjects.push(spawnTimer);
        spawnTimer.start();
    },

    spawnRandomAnimals: function () {
        for (var kind in this.animalKindFrequency) {
            var probability = 1.0 / this.animalKindFrequency[kind];
            if (Math.random() < probability) {
                var animal;
                if (DeerHuhn.Animals.AnimalFactory.factories[kind] !== undefined) {
                    var factory = DeerHuhn.Animals.AnimalFactory.factories[kind];
                    animal = factory.call(this.animalFactory,
                        this.animalOnShotCallback, 
                        this.animalMovementFinishedCallback
                    );
                } else {
                    var factory = DeerHuhn.Animals.AnimalFactory.staticFactories[kind];
                    animal = factory.call(this.animalFactory,
                        this.staticObjectOnShotCallback
                    );
                }
                this.addAnimal(animal);
            }
        }
    },

    addAnimal: function(animal) {
        this.backgroundLayers[animal.scenePosition.layer].addChild(animal.sprite);
        this.addSprite(animal.sprite);
        this.animals.push(animal);

        if (animal instanceof DeerHuhn.AnimatedObject)
            this.pausableObjects.push(animal);

        if (animal instanceof DeerHuhn.MovingAnimatedObject)
            this.movingObjects.push(animal);

        for (var i=0; i < animal.childrenToSpawn.length; i++) {
            var childToSpawn = animal.childrenToSpawn[i];
            var timer = new DeerHuhn.PausableTimeout(function(childToSpawn) {
                this.pausableObjects.remove(timer);
                // do not spawn children if the parent has been killed in the meantime
                if (childToSpawn.animal.parentAnimal === null)
                    return;

                this.addAnimal(childToSpawn.animal);
            }.bind(this, childToSpawn), childToSpawn.delay);
            this.pausableObjects.push(timer);
            timer.start();
        }

        animal.childrenToSpawn = [];

        
        if (animal.hideAfter !== undefined) {
            var timer = new DeerHuhn.PausableTimeout(function(animal) {
                if (this.animals.indexOf(animal) >= 0) {
                    // the animal may not exist because it has already been shot
                    this.pausableObjects.remove(timer);
                    this.animalMovementFinishedCallback.call(this, animal);
                }
            }.bind(this, animal), animal.hideAfter);
            this.pausableObjects.push(timer);
            timer.start();
        }
    },

    removeAnimal: function(animal) {
        if (animal.parentAnimal !== undefined && animal.parentAnimal !== null) {
            animal.parentAnimal.childrenAnimals.remove(animal);
        }

        if (animal.childrenAnimals !== undefined) {
            for (var i = 0; i < animal.childrenAnimals.length; i++) {
                animal.childrenAnimals[i].parentAnimal = null;
            }
        }

        this.backgroundLayers[animal.scenePosition.layer].removeChild(animal.sprite);
        this.removeSprite(animal.sprite);
        this.animals.remove(animal);

        if (animal instanceof DeerHuhn.AnimatedObject)
            this.pausableObjects.remove(animal);

        if (animal instanceof DeerHuhn.MovingAnimatedObject)
            this.movingObjects.remove(animal);
    },

    updateMovingObjects: function(timeDelta) {
        for (var i = 0; i < this.movingObjects.length; i++) {
            var movingObject = this.movingObjects[i];
            movingObject.updatePosition(timeDelta, this.renderingScale);
        }
    },

    canShoot: function() {
        return !this.isPaused && this.ammo > 0 && this.reloadingAmmo === false;
    },

    shoot: function() {
        if (this.reloadingAmmo === true)
            return;

        this.ammo -= 1;
        this.updateAmmo();
        this.sounds.shot.play();
    },

    reloadAmmo: function() {
        if (this.reloadingAmmo === true)
            return;

        // implement 1000ms delay between reload request and actual reload
        var reloadTimer = new DeerHuhn.PausableTimeout(function() {
            this.ammo = this.MAX_AMMO;
            this.updateAmmo();
            this.pausableObjects.remove(reloadTimer);
            this.reloadingAmmo = false;
        }.bind(this), 1000);
        this.pausableObjects.push(reloadTimer);
        reloadTimer.start();
        this.reloadingAmmo = true;

        this.sounds.reload.play();
    },

    initializeImages: function() {
        var assets = [
            'images/vrstva0.png', 
            'images/vrstva1.png', 
            'images/vrstva2.png', 
            'images/vrstva3.png', 
            'images/vrstva4.png', 
            'images/vrstva5.png', 
            'images/sprites-interactive.json', 
            'images/sprites-passive.json'
        ];
        var loader = new PIXI.AssetLoader(assets);
        //loader.onProgress = onAssetLoaderProgress //TODO
        loader.onComplete = this.onLoad.bind(this);
        loader.load();
    },

    resize: function() {
        this.rendererWidth = this.GAME_CONTAINER.offsetWidth - 8;
        this.rendererHeight = Math.min(this.GAME_CONTAINER.offsetHeight - 8, this.MAX_HEIGHT);
        this.renderingScale = this.rendererHeight/this.MAX_HEIGHT;

        this.renderer.resize(this.rendererWidth, this.rendererHeight);

        // the scaling propagates to children
        this.stage.scale.x = this.stage.scale.y = this.renderingScale; 

        for (var i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i].onresize !== undefined) {
                this.sprites[i].onresize();
            }
        }

        this.stage.updateTransform();
    },

    pause: function() {
        if (this.unPauseCountdownTimer !== null) {
            this.unPauseCountdownTimer.stop();
            this.pausableObjects.remove(this.unPauseCountdownTimer);
            this.unPauseCountdownTimer = null;
        }

        for (var i=0; i < this.unPauseCountdownDigits.length; i++)
            this.unPauseCountdownDigits[0].visible = false;

        this.animate(true);

        if (this.isPaused)
            return;

        this.isPaused = true;
        this.pauseStartTime = new Date();

        for (var obj in this.pausableObjects) {
            if ('pause' in this.pausableObjects[obj]) {
                this.pausableObjects[obj].pause();
            }
        }
    },

    unPause: function() {
        // at startup and in some rare cases of blurring/focusing the window, this case can happen
        if (!this.isPaused || this.pauseStartTime === null)
            return;

        // sometimes the unpause callback is called twice, this should handle that case
        if (this.unPauseCountdownTimer !== null)
            return;

        for (var i=0; i< this.unPauseCountdownDigits.length; i++)
            this.unPauseCountdownDigits[0].visible = false;

        // 3 seconds timeout
        this.unPauseCountdownTimer = new DeerHuhn.PausableTimeout(function () {
            this.pausableObjects.remove(this.unPauseCountdownTimer);
            this.unPauseCountdownTimer = new DeerHuhn.PausableTimeout(function () {
                this.pausableObjects.remove(this.unPauseCountdownTimer);
                this.unPauseCountdownTimer = new DeerHuhn.PausableTimeout(function () {

                    this.unPauseCountdownTimer = null;

                    this.isPaused = false;
                    var timeDelta = new Date().valueOf() - this.pauseStartTime.valueOf();

                    for (var obj in this.pausableObjects) {
                        if ('unPause' in this.pausableObjects[obj]) {
                            this.pausableObjects[obj].unPause(timeDelta);
                        }
                    }

                    this.unPauseCountdownDigits[2].visible = false;

                    this.lastAnimationFrameTime = new Date();
                    this.animate(true);
                }.bind(this), 1000);
                this.pausableObjects.push(this.unPauseCountdownTimer);
                this.unPauseCountdownTimer.start();
                this.unPauseCountdownDigits[1].visible = false;
                this.unPauseCountdownDigits[2].visible = true;
                this.animate(true);
            }.bind(this), 1000);
            this.pausableObjects.push(this.unPauseCountdownTimer);
            this.unPauseCountdownTimer.start();
            this.unPauseCountdownDigits[0].visible = false;
            this.unPauseCountdownDigits[1].visible = true;
            this.animate(true);
        }.bind(this), 1000);
        this.pausableObjects.push(this.unPauseCountdownTimer);
        this.unPauseCountdownTimer.start();
        this.unPauseCountdownDigits[0].visible = true;
        this.animate(true);
    },

    blur: function() {
        this.pause();
    },

    focus: function() {
        this.unPause();
    }
};

// CLASS DeerHuhn.PausableTimeout

/**
 * A timeout like setTimeout that can be paused.
 *
 * @constructor
 * @param callback The callback to call when the time is up.
 * @param {int} timeout The delay before calling the #callback.
 */
DeerHuhn.PausableTimeout = function (callback, timeout) {
    
    /**
     * The interval after which the callback should be called.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {int}
     */
    this.timeout = timeout;

    /**
     * The callback to call when the time is up.
     *
     * @property
     *
     * @private
     * @readonly
     */
    this.callback = callback;

    /**
     * Id of the setTimeout timer.
     *
     * @property
     *
     * @private
     * @type {int}
     */
    this.timerId = null;

    /**
     * The time the timer was started. Is adjusted after #unPause.
     *
     * @property
     *
     * @private
     * @type {Date}
     */
    this.startTime = null;

    /**
     * Set to true after the timer has been fired.
     *
     * @property
     *
     * @private
     * @type {boolean}
     */
    this.fired = false;
};

/**
 * Start the timer. Should only be called once.
 */
DeerHuhn.PausableTimeout.prototype.start = function () {
    this.startTime = new Date();
    this.unPause(0);
};

/**
 * Pause the timer.
 */
DeerHuhn.PausableTimeout.prototype.pause = function () {
    if (this.fired)
        return;

    window.clearTimeout(this.timerId);
};

/**
 * Unpause the timer.
 *
 * @param {Number} timeDelta The time between pause and unPause calls (in ms).
 */
DeerHuhn.PausableTimeout.prototype.unPause = function (timeDelta) {
    if (this.fired)
        return;

    // ignore unPause before the timer is started
    if (this.startTime === null)
        return;

    this.startTime.setUTCMilliseconds(this.startTime.getUTCMilliseconds() + timeDelta);
    var now = new Date();
    var delay = this.timeout - (now.valueOf() - this.startTime.valueOf());

    var timerCallback = function () {
        this.fired = true;
        this.callback();
    };

    if (delay <= 0) {
        timerCallback.call(this);
    } else {
        this.timerId = window.setTimeout(timerCallback.bind(this), delay);
    }
};

/**
 * Stop the timeout (both before and after firing).
 */
DeerHuhn.PausableTimeout.prototype.stop = function() {
    this.pause();
    this.fired = true;
};

// CLASS DeerHuhn.PausableInterval

/**
 * A pausable repeating timer similar to setInterval.
 *
 * @constructor
 * @param callback The callback to call when the interval is up.
 * @param {int} interval The interval in which the callback should be called.
 */
DeerHuhn.PausableInterval = function (callback, interval) {
    
    /**
     * The interval after which the callback should be called (in ms).
     *
     * @property
     *
     * @private
     * @readonly
     * @type {int}
     */
    this.interval = interval;

    /**
     * The callback to call when the interval is up.
     *
     * @property
     *
     * @private
     * @readonly
     */
    this.callback = callback;

    /**
     * The last time the repetition occured.
     * 
     * Has to be set in the #start() method.
     *
     * @property
     *
     * @private
     * @type {Date}
     */
    this.lastRepetitionTime = null;

    /**
     * Id of the repetition timer.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {int}
     */
    this.intervalTimerId = null;

    /**
     * The timer used to wait before triggering the interval timer after pausing.
     *
     * @property
     *
     * @private
     * @type {DeerHuhn.PausableTimeout}
     */
    this.timeoutTimer = null;

    /**
     * True if the timer has been stopped. 
     *
     * Should only be called once.
     *
     * @property
     *
     * @private
     * @type {boolean}
     */
    this.stopped = false;
};

/**
 * Start the timer. Repetition at time 0 is skipped. Should only be called once.
 */
DeerHuhn.PausableInterval.prototype.start = function () {
    this.lastRepetitionTime = new Date();
    this.unPause(0);
};

/**
 * Pause the timer.
 */
DeerHuhn.PausableInterval.prototype.pause = function () {
    if (this.stopped)
        return;

    window.clearInterval(this.intervalTimerId);
    if (this.timeoutTimer !== null)
        this.timeoutTimer.pause();
};

/**
 * Unpause the timer.
 *
 * @param {Number} timeDelta The time between pause and unPause calls (in ms).
 */
DeerHuhn.PausableInterval.prototype.unPause = function (timeDelta) {
    if (this.stopped)
        return;

    // ignore unPause before the timer is started
    if (this.lastRepetitionTime === null)
        return;

    this.lastRepetitionTime.setUTCMilliseconds(this.lastRepetitionTime.getUTCMilliseconds() + timeDelta);

    if (this.timeoutTimer !== null) {
        this.timeoutTimer.unPause(timeDelta);
        return;
    }

    var now = new Date();
    var repetitionDelay = this.interval - (now.valueOf() - this.lastRepetitionTime.valueOf());

    var repetitionCallback = function () {
        this.lastRepetitionTime = new Date();
        this.callback();
    };

    if (repetitionDelay <= 0) {
        repetitionCallback.call(this);
        this.intervalTimerId = window.setInterval(repetitionCallback.bind(this), this.interval);
    } else {
        var callback = function () {
            repetitionCallback.call(this);
            this.intervalTimerId = window.setInterval(repetitionCallback.bind(this), this.interval);
            this.timeoutTimer = null;
        };
        this.timeoutTimer = new DeerHuhn.PausableTimeout(callback.bind(this), repetitionDelay);
        this.timeoutTimer.start();
    }
};

/**
 * Stop the timer. Should only be called once. 
 * 
 * For temporary disabling the timer, use #pause.
 */
DeerHuhn.PausableInterval.prototype.stop = function () {
    this.pause();
    this.stopped = true;
};

// CLASS DeerHuhn.GameTime

/**
 * The callback to call when the date is changed.
 *
 * @callback dateChangeCallback
 */

/**
 * The callback to call when the time is up.
 *
 * @callback gameOverCallback
 */

/**
 * The time of the game.
 *
 * @constructor
 * @param {dateChangeCallback} dateChangeCallback The callback to call when the date is changed.
 * @param {gameOverCallback} gameOverCallback The callback to call when the time is up.
 */
DeerHuhn.GameTime = function (dateChangeCallback, gameOverCallback) {
    
    /**
     * The callback to call when the date is changed.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {dateChangeCallback}
     */
    this.dateChangeCallback = dateChangeCallback;

    /**
     * The callback to call when the time is up.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {gameOverCallback}
     */
    this.gameOverCallback = gameOverCallback;

    /**
     * The current date representation.
     *
     * It has to be initialized with a non-leap year and time at midnight.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {Date}
     */
    this.date = new Date("Mar 01, 2013 00:00:00");

    /**
     * Id of the repetition timer used to wait for #delayAfterUnPause ms before triggering the timer after pausing.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {DeerHuhn.PausableInterval}
     */
    this.intervalTimer = new DeerHuhn.PausableInterval(this.increaseDate.bind(this), 600);
};

/**
 * Start the game timer. Should only be called once.
 */
DeerHuhn.GameTime.prototype.start = function () {
    this.intervalTimer.start();
};

/**
 * Pause the timer.
 */
DeerHuhn.GameTime.prototype.pause = function () {
    this.intervalTimer.pause();
};

/**
 * Unpause the timer.
 *
 * @param {Number} timeDelta The time between pause and unPause calls (in ms).
 */
DeerHuhn.GameTime.prototype.unPause = function (timeDelta) {
    this.intervalTimer.unPause(timeDelta);
};

/**
 * Add one day to the game timer. Call #gameOverCallback if the game is over.
 *
 * @private
 */
DeerHuhn.GameTime.prototype.increaseDate = function () {
    // if the day overflows, the month gets increased and day is reset to 1
    this.date.setDate(this.date.getDate() + 1);

    this.dateChangeCallback();

    // months are indexed from 0 and we stop in December
    if (this.date.getMonth() === 11) {
        this.intervalTimer.stop();
        this.gameOverCallback();
    }
};

/**
 * Return the current day number.
 *
 * @return {int} The day number (1-31).
 */
DeerHuhn.GameTime.prototype.getDay = function () {
    return this.date.getDate();
};

/**
 * Return the current month number.
 *
 * @return {int} The month number (1-12).
 */
DeerHuhn.GameTime.prototype.getMonth = function () {
    // the month from Date is between 0-11.
    return this.date.getMonth() + 1;
};

// CLASS DeerHuhn.ScenePosition

/*
 * A class specifying position of an object in a layered scene.
 */
DeerHuhn.ScenePosition = function(layer, x, y) {
    this.layer = layer;
    this.x = x;
    this.y = y;
};

// CLASS DeerHuhn.ScenePositionWithScale

/**
 * A class specifying a position in a layered scene along with scale of the object (may be negative to flip the object).
 */
DeerHuhn.ScenePositionWithScale = function (layer, x, y, scale) {
    DeerHuhn.ScenePosition.call(this, layer, x, y);

    if (typeof scale === "number")
        this.scale = new PIXI.Point(scale,scale);
    else
        this.scale = new PIXI.Point(scale.x,scale.y);
};
DeerHuhn.ScenePositionWithScale.prototype = Object.create(DeerHuhn.ScenePosition.prototype);
DeerHuhn.ScenePositionWithScale.prototype.constructor = DeerHuhn.ScenePositionWithScale;

// CLASS DeerHuhn.ScenePath

/*
 * A (oriented) path in the scene (in a single layer).
 */
DeerHuhn.ScenePath = function(layer, x1, y1, x2, y2) {
    this.layer = layer;
    this.startPosition = new DeerHuhn.ScenePosition(layer, x1, y1);
    this.endPosition = new DeerHuhn.ScenePosition(layer, x2, y2);
    this.length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
};

DeerHuhn.ScenePath.prototype = {
    /*
     * Return the interpolated position along the path.
     *
     * The default implementation does just a linear interpolation.
     *
     * @param float percentComplete The percentage of the movement completed (number 0.0 to 1.0).
     */
    interpolatePosition: function(percentComplete) {
        var x = this.startPosition.x + percentComplete * (this.endPosition.x - this.startPosition.x);
        var y = this.startPosition.y + percentComplete * (this.endPosition.y - this.startPosition.y);
        return new DeerHuhn.ScenePosition(this.layer, x, y);
    },

    /*
     * Returns a scenepath with reverted direction (swaps endpoints).
     */
    reverse: function() {
        return new DeerHuhn.ScenePath(this.layer, 
            this.endPosition.x, this.endPosition.y,
            this.startPosition.x, this.startPosition.y);
    }
};

// CLASS DeerHuhn.SceneObject

/**
 * An object in the scene (interactive or not).
 *
 * @constructor
 * @param {PIXI.Sprite} sprite The sprite representing this scene object.
 */
DeerHuhn.SceneObject = function (sprite) {
    /**
     * The sprite representing this scene object.
     *
     * @property
     * @public
     * @readonly
     * @type {PIXI.Sprite}
     */
    this.sprite = sprite;
};

// CLASS DeerHuhn.ShootableObject

/**
 * The callback to call after the object is shot.
 *
 * @callback onShotCallback
 * @this DeerHuhn
 * @param {DeerHuhn.ShootableObject} animal The shot object.
 * @return {boolean} True if the object was really shot (enough ammo and so on).
 */

/**
 * An object that can be shot. The basic interactive object in the game.
 *
 * @constructor
 * @extends DeerHuhn.SceneObject
 * @param {PIXI.Sprite} sprite The sprite representing this scene object.
 * @param {onShotCallback} onShotCallback The callback to call after the object is shot.
 */
DeerHuhn.ShootableObject = function (sprite, onShotCallback) {

    DeerHuhn.SceneObject.call(this, sprite);

    /**
     * The callback to call after the object is shot.
     *
     * @property
     * @protected
     * @type {onShotCallback}
     */
    this.onShotCallback = onShotCallback;

    /**
     * True if this object has already been shot.
     *
     * @property
     * @public
     * @type {boolean}
     */
    this.shot = false;

    // we can click through transparent areas of objects
    var useWebGL = (this.renderer instanceof PIXI.WebGLRenderer);
    this.sprite.hitArea = PIXI.TransparencyHitArea.create(this.sprite, useWebGL);

    this.sprite.setInteractive(true);

    // click means shot
    var onClick = function (mouse) {
        var evt = mouse.originalEvent;
        if ("which" in evt)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isLeft = evt.which == 1; 
        else if ("button" in evt)  // IE, Opera 
            isLeft = evt.button == 1;

        if (!isLeft)
            return true;

        this.onShot();
        return false; // stop event bubbling
    };
    this.sprite.click = onClick.bind(this);
};
DeerHuhn.ShootableObject.prototype = Object.create(DeerHuhn.SceneObject.prototype);
DeerHuhn.ShootableObject.prototype.constructor = DeerHuhn.ShootableObject;

/**
 * Process the shot event (should call {@link DeerHuhn.ShootableObject.onShotCallback}).
 */
DeerHuhn.ShootableObject.prototype.onShot = function () {
    this.shot = true;
    this.onShotCallback(this);
};

/**
 * Get the score for shooting the object in the given game time.
 *
 * @abstract
 * @param {DeerHuhn.GameTime} gameTime The game time to get score in.
 * @return {int} Score for shooting this object.
 */
DeerHuhn.ShootableObject.prototype.getScore = function (gameTime) {
    throw new Error('Must be implemented in descendants.');
};

// CLASS DeerHuhn.AnimatedObject

/**
 * A shootable object with animated sprite.
 *
 * @constructor
 * @extends DeerHuhn.ShootableObject
 * @param {PIXI.MovieClip} sprite The sprite representing this scene object.
 * @param {onShotCallback} onShotCallback The callback to call after the object is shot.
 * @param {number} animationSpeed Speed of the animation (in animation frames per second).
 */
DeerHuhn.AnimatedObject = function (sprite, onShotCallback, animationSpeed) {
    DeerHuhn.ShootableObject.call(this, sprite, onShotCallback);

    /**
     * Speed of the animation (in animation frames per second).
     *
     * @property
     * @protected
     * @readonly
     * @type {number}
     */
    this.animationSpeed = animationSpeed;

    this.sprite.loop = true;
    this.sprite.animationSpeed = animationSpeed;
    this.sprite.gotoAndPlay(0);
};
DeerHuhn.AnimatedObject.prototype = Object.create(DeerHuhn.ShootableObject.prototype);
DeerHuhn.AnimatedObject.prototype.constructor = DeerHuhn.AnimatedObject;

DeerHuhn.AnimatedObject.prototype.pause = function () {
    this.sprite.stop();
};

DeerHuhn.AnimatedObject.prototype.unPause = function () {
    this.sprite.play();
};

// CLASS DeerHuhn.MovingAnimatedObject

/**
 * The callback to call when the object arrives at its target or disappears in another way.
 *
 * @callback movementFinishedCallback
 * @this DeerHuhn
 * @param {PIXI.MovingAnimatedObject} animal The animal that finished moving.
 */

/**
 * A animated shootable object which moves through the scene along a path.
 *
 * @constructor
 * @extends DeerHuhn.AnimatedObject
 * @param {PIXI.MovieClip} sprite The sprite representing this scene object.
 * @param {onShotCallback} onShotCallback The callback to call after the object is shot.
 * @param {number} animationSpeed Speed of the animation (in animation frames per second).
 * @param {number} sceneSpeed Speed of the object in px/ms.
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.MovingAnimatedObject = function (sprite, onShotCallback, animationSpeed, sceneSpeed, scenePath, movementFinishedCallback) {
    DeerHuhn.AnimatedObject.call(this, sprite, onShotCallback, animationSpeed);

    /**
     * Speed of the object in px/ms.
     *
     * @property
     * @protected
     * @type {number}
     */
    this.sceneSpeed = sceneSpeed;

    /**
     * The path this object moves along.
     *
     * @property
     * @protected
     * @type {DeerHuhn.ScenePath}
     */
    this.scenePath = scenePath;

    /**
     * The callback to call when the object arrives at its target.
     *
     * @property
     * @protected
     * @type {movementFinishedCallback}
     */
    this.movementFinishedCallback = movementFinishedCallback;

    /**
     * Percent (0.0 - 1.0) of the path already completed.
     *
     * @property
     * @protected
     * @type {float}
     */
    this.movementPercentComplete = 0.0;

    /**
     * Position of this object in the scene.
     *
     * @property
     * @protected
     * @type {DeerHuhn.ScenePosition}
     */
    this.scenePosition = scenePath.startPosition;
};
DeerHuhn.MovingAnimatedObject.prototype = Object.create(DeerHuhn.AnimatedObject.prototype);
DeerHuhn.MovingAnimatedObject.prototype.constructor = DeerHuhn.MovingAnimatedObject;

/**
 * Update the sprite and scene position.
 *
 * @param {int} timeDelta The number of miliseconds from the last position update.
 */
DeerHuhn.MovingAnimatedObject.prototype.updatePosition = function(timeDelta) {
    this.movementPercentComplete += timeDelta * this.sceneSpeed / this.scenePath.length;
    if (this.movementPercentComplete >= 1) {
        this.movementPercentComplete = 1;
        if (this.movementFinishedCallback !== undefined)
            this.movementFinishedCallback(this);
    }

    this.scenePosition = this.scenePath.interpolatePosition(this.movementPercentComplete);

    this.sprite.position.x = this.scenePosition.x;
    this.sprite.position.y = this.scenePosition.y;

    if (this.isMovingLeft() && this.sprite.scale.x > 0) {
        this.sprite.scale.x = -this.sprite.scale.x;
    } else if (!this.isMovingLeft() && this.sprite.scale.x < 0) {
        this.sprite.scale.x = -this.sprite.scale.x;
    }
};

/**
 * Returns true if the object is moving left; false means moving right.
 *
 * @return {boolean} true if the object is moving left; false means moving right.
 */
DeerHuhn.MovingAnimatedObject.prototype.isMovingLeft = function() {
    return this.scenePath.startPosition.x > this.scenePath.endPosition.x;
};

// CLASS DeerHuhn.Animal

/**
 * A shootable animal.
 *
 * @constructor
 * @extends DeerHuhn.MovingAnimatedObject
 * @param {string} name The name of the animal (of the species).
 * @param {PIXI.MovieClip} sprite The sprite representing this scene object.
 * @param {number} animationSpeed Speed of the animation (in animation frames per second).
 * @param {number} sceneSpeed Speed of the object in px/ms.
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animal = function(name, sprite, onShotCallback, animationSpeed, sceneSpeed, scenePath, movementFinishedCallback) {
    DeerHuhn.MovingAnimatedObject.call(this, sprite, onShotCallback, animationSpeed, sceneSpeed, scenePath, movementFinishedCallback);

    this.name = name;
    this.sprite.name = name;

    this.sprite.position.x = -1000;
    this.sprite.position.y = -1000;

    /**
     * The (biological) parent of this animal if it has one.
     * 
     * @property
     * @protected
     * @readonly
     * @type {DeerHuhn.Animal}
     */
    this.parentAnimal = null;

    /**
     * A list of children to add after this animal is added to the game.
     * 
     * @property
     * @public
     * @readonly
     * @type {DeerHuhn.AnimalToSpawn[]}
     */
    this.childrenToSpawn = [];

    /**
     * A list of children this animal has.
     * 
     * @property
     * @protected
     * @readonly
     * @type {DeerHuhn.Animal[]}
     */
    this.childrenAnimals = [];

    this.sprite.scale.x = this.sprite.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
};
DeerHuhn.Animal.prototype = Object.create(DeerHuhn.MovingAnimatedObject.prototype);
DeerHuhn.Animal.prototype.constructor = DeerHuhn.Animal;

/**
 * An animal to be spawned into the game after some delay.
 *
 * @constructor
 * @param {DeerHuhn.Animal} animal The animal to spawn.
 * @param {int} delay Delay before spawning (in ms).
 */
DeerHuhn.AnimalToSpawn = function (animal, delay) {
    /**
     * The animal to spawn.
     * 
     * @property
     * @public
     * @readonly
     * @type {DeerHuhn.Animal}
     */
    this.animal = animal;

    /**
     * Delay before spawning (in ms).
     * 
     * @property
     * @public
     * @readonly
     * @type {int}
     */
    this.delay = delay;
};

// ANIMALS

/**
 * All kinds of animals and other shootable objects in the game.
 *
 * @namespace
 */
DeerHuhn.Animals = {};

// keys -> "frame" prefixes, values -> array of PIXI.Texture
DeerHuhn.Animals.animationTexturesCache = [];

/**
 * Factory for animals.
 *
 * @constructor
 */
DeerHuhn.Animals.AnimalFactory = function() {
};

/**
 * Choose a random object from the given set.
 *
 * @param {...Object[]} objects Objects to choose from.
 * @return {Object} A random object from the given lists.
 */
DeerHuhn.Animals.AnimalFactory.prototype.getRandomObject = function(objects) {
    var objectArrays = arguments;
    var numObjects = 0;
    for (var i = 0; i < arguments.length; i++)
        numObjects += objectArrays[i].length;

    var randPositionIdx = randInt(0, numObjects-1);

    var selected = null;
    for (var i = 0; i < objectArrays.length; i++) {
        if (randPositionIdx >= objectArrays[i].length) {
            randPositionIdx -= objectArrays[i].length;
        } else {
            selected = objectArrays[i][randPositionIdx];
            break;
        }
    }

    if (selected === null) {
        console.log('Error in selecting random object from ' + arguments.length + ' arguments.');
    }

    return selected;
};


/**
 * Choose a random path from the given set.
 *
 * @param {...DeerHuhn.ScenePath[]} paths All possible paths to choose from.
 * @return {DeerHuhn.ScenePath} A random path from the given lists (might have reversed direction).
 */
DeerHuhn.Animals.AnimalFactory.prototype.getRandomPath = function(paths) {
    var path = this.getRandomObject.apply(this, arguments);

    if (Math.random() > 0.5)
        path = path.reverse();

    return path;
};

/**
 * Create a random animal on a random path.
 *
 * @param {onShotCallback} onShotCallback The callback to call after the object is shot.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animal} A random animal on a random path.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createRandomAnimal = function (onShotCallback, movementFinishedCallback) {
    var keys = Object.keys(DeerHuhn.Animals.AnimalFactory.factories);
    var randFactoryIdx = randInt(0, keys.length-1);

    var randFactory = DeerHuhn.Animals.AnimalFactory.factories[keys[randFactoryIdx]];
    return randFactory.call(this, onShotCallback, movementFinishedCallback);
};

/**
 * The array of registered factories.
 */
DeerHuhn.Animals.AnimalFactory.factories = [];

/**
 * The array of registered factories for static shootable objects.
 */
DeerHuhn.Animals.AnimalFactory.staticFactories = [];

// animals are defined in js\deerhuhn.animals.js

// CLASS StaticShootableObject

/**
 * An object that is not moving but can be shot (a bird's house for example).
 */
DeerHuhn.StaticShootableObject = function (name, sprite, scenePosition, onShotCallback) {
    DeerHuhn.ShootableObject.call(this, sprite, onShotCallback);

    this.name = name;

    this.sprite = sprite;
    this.sprite.name = this.name;
    this.sprite.scale = new PIXI.Point(scenePosition.scale.x, scenePosition.scale.y);

    this.scenePosition = scenePosition;
    this.sprite.position.x = scenePosition.x;
    this.sprite.position.y = scenePosition.y;

    this.childrenToSpawn = [];
};
DeerHuhn.StaticShootableObject.prototype = Object.create(DeerHuhn.ShootableObject.prototype);
DeerHuhn.StaticShootableObject.prototype.constructor = DeerHuhn.StaticShootableObject;

// CLASS DeerHuhn.FadingPoints

/**
 * A score text blending until transparent.
 *
 * @constructor
 * @param {int} points The number of points to represent.
 * @param {number} duration The duration until fully transparent (in ms).
 * @param {DeerHuhn.ScenePosition} position The position to display at (in layer frame).
 * @param {movementFinishedCallback} fadingFinishedCallback The callback to call when the object fades out.
 * @param {DeerHuhn} deerHuhn The game object (to allow registering the timers). //XXX needs refactoring
 */
DeerHuhn.FadingPoints = function (points, duration, position, fadingFinishedCallback, deerHuhn) {
    var color = (points >= 0 ? '#8E8D5B' : '#FF0000');

    /**
     * The sprite displaying the text with the points.
     *
     * @property
     * @protected
     * @readonly
     * @type {PIXI.Sprite}
     */
    this.sprite = new PIXI.Text(points+'', {font: 'bold 120px HelveticaBlack', fill: color});

    /**
     * The number of points to represent.
     *
     * @property
     * @protected
     * @readonly
     * @type {int}
     */
    this.points = points;

    /**
     * The duration until fully transparent (in ms).
     *
     * @property
     * @protected
     * @readonly
     * @type {number}
     */
    this.duration = duration;

    /**
     * The position to display at (in layer frame).
     *
     * @property
     * @protected
     * @readonly
     * @type {DeerHuhn.ScenePosition}
     */
    this.position = position;

    /**
     * The callback to call when the object fades out.
     *
     * @property
     * @protected
     * @readonly
     * @type {movementFinishedCallback}
     */
    this.fadingFinishedCallback = fadingFinishedCallback;

    this.numFadingSteps = 10.0;

    this.sprite.position = this.position;

    var fadingTimer = new DeerHuhn.PausableInterval(function () {
        this.sprite.alpha -= 1/this.numFadingSteps;
        if (this.sprite.alpha <= 0) {
            fadingTimer.stop();
            deerHuhn.pausableObjects.remove(fadingTimer);
            this.fadingFinishedCallback(this);
        }
    }.bind(this), this.duration/this.numFadingSteps);
    fadingTimer.start();
    deerHuhn.pausableObjects.push(fadingTimer);
};

// CLASS DeerHuhn.SingletonSoundSample

/**
 * A sound sample that can be played during the game and can be automatically paused.
 *
 * @constructor
 * @param {object} howlConfig Config of the Howler sound.
 */
DeerHuhn.SingletonSoundSample = function (howlConfig) {

    // we need the id of the howl, and autoplay doesn't support getting the ID, so we have to simulate autoplay if needed
    var wantsAutoplay = howlConfig.autoplay === true;
    howlConfig.autoplay = false;

    /**
     * The sound object.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {Howl}
     */
    this.howl = new Howl(howlConfig);

    /**
     * ID of the playing howl. Has to be assigned the first time the howl is played.
     *
     * @property
     *
     * @private
     * @type {object}
     */
    this.howlId = null;

    /**
     * True if the sound sample should be resumed after unPause.
     *
     * @property
     *
     * @private
     * @type {boolean}
     */
    this.resumeAfterUnPause = wantsAutoplay;

    if (wantsAutoplay) {
        this.howl.play(function (id) {
            this.howlId = id;
        }.bind(this));
    }
};

/**
 * Pause the sound.
 */
DeerHuhn.SingletonSoundSample.prototype.pause = function () {
    this.resumeAfterUnPause = this.isPlaying();

    try {
        if (this.howlId !== null)
            this.howl.pause(this.howlId);
        else
            this.howl.pause();
    } catch (e) {
        // if you call pause twice or more times, web audio will not like you, because you can only call stop() once
    }
};

/**
 * Unpause the sound.
 */
DeerHuhn.SingletonSoundSample.prototype.unPause = function () {
    if (this.resumeAfterUnPause)
        this.play();
};

/**
 * Play the sound. If the sound is already playing, ignore.
 */
DeerHuhn.SingletonSoundSample.prototype.play = function() {
    if (!this.isPlaying()) {
        this.howl.play(function (id) {
            this.howlId = id;
        }.bind(this));
    }
};

/**
 * Return True if the sample is currently playing.
 *
 * @return {boolean} True if the sample is currently playing.
 */
DeerHuhn.SingletonSoundSample.prototype.isPlaying = function () {
    if (this.howlId === null)
        return false;

    // hack
    return !this.howl._nodeById(this.howlId).paused;
};

// CLASS DeerHuhn.SoundSample

/**
 * A sound sample that can be played during the game and can be automatically paused.
 *
 * @constructor
 * @param {object} howlConfig Config of the Howler sound.
 */
DeerHuhn.SoundSample = function (howlConfig) {
    /**
     * The sound object.
     *
     * @property
     *
     * @private
     * @readonly
     * @type {Howl}
     */
    this.howl = new Howl(howlConfig);

    /**
     * Ids of the playing howls.
     *
     * @property
     *
     * @private
     * @type {object[]}
     */
    this.playingIds = []; 
};

/**
 * Pause the sound.
 */
DeerHuhn.SoundSample.prototype.pause = function () {
    // remove all finished sounds
    var playing = [];
    for (var i=0; i<this.playingIds.length; i++) {
        if (!this.howl._nodeById(this.playingIds[i]).paused)
            playing.push(this.playingIds[i]);
    }
    this.playingIds = playing;

    for (var i=0; i<this.playingIds.length; i++) {
        try {
            this.howl.pause(this.playingIds[i]);
        } catch (e) {
           // if you call pause twice or more times, web audio will not like you, because you can only call stop() once
        }
    }
};

/**
 * Unpause the sound.
 */
DeerHuhn.SoundSample.prototype.unPause = function () {
    for (var i=0; i<this.playingIds.length; i++) {
        this.howl.play(this.playingIds[i]);
    }
};

/**
 * Play the sound. If the sound is already playing, play it in parallel to it.
 */
DeerHuhn.SoundSample.prototype.play = function() {
    this.howl.play(function (id) {
        this.playingIds.push(id);
    }.bind(this));
};

// MISC UTILITIES

/*
 * Add a "remove by value" to array prototype. It only removes first instance of the value.
 */
Array.prototype.remove = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            break;
        }
    }
    return this;
};

function randInt(min, max) {
    var result = Math.floor((Math.random() * ((max*1.0 + 1) - min)) + min);
    if (result == max + 1)
        return min;
    return result;
}
