var DeerHuhn = function (canvasContainerId) {
    this.loadingElem = document.getElementById('loading');

    cookie.defaults.expires = 365; // in days

    // canvas & dimensions
    this.MAX_HEIGHT=DeerHuhn.SCENE_HEIGHT;
    this.GAME_CONTAINER = document.getElementById(canvasContainerId);
    this.rendererWidth = this.GAME_CONTAINER.offsetWidth - 8;
    this.rendererHeight = Math.min(this.GAME_CONTAINER.offsetHeight - 8, this.MAX_HEIGHT);
    this.renderingScale = this.rendererHeight/this.MAX_HEIGHT;
    this.MAX_AMMO = 5;
    this.animalKindFrequency = {
        Liska: 8,
        AutoCervene: 20,
        AutoModre: 30,
        KachnaPlove: 45,
        Kachna: 17,
        LKT: 100,
        LKTWithKlady: 100,
        Odvozka: 130,
        Ovce: 30,
        Prase: 25,
        Vlacek: 70,
        Sele: 18,
        Srna: 35,
        Kvitko: 20,
        VykukujiciSrnec: 75
    };

    // scrolling
    // whether the background is scrolling; 0: no scrolling; -1: scrolling left; 1: scrolling right
    this.scrollingDirection = 0;
    // scrolling direction given by mouse; gets overridden by keyboard
    this.scrollingDirectionByMouse = 0;
    // how much is the background scrolled from the left (in the overall percentage of possible scroll)
    this.scrollPercentage = 0.0;
    this.SCROLL_PERCENTAGE_STEP_PER_SECOND = 35/100.0;

    // stages setup
    var interactive = true;
    this.stages = {};
    this.stages.menu = new PIXI.ScalableStage(0x000000, interactive);
    this.stages.menu.name = "Menu stage";
    this.stages.game = new PIXI.ScalableStage(0x000000, interactive);
    this.stages.game.name = "Game stage";
    this.stages.gameOver = new PIXI.ScalableStage(0x000000, interactive);
    this.stages.gameOver.name = "Game over stage";
    this.stages.rules = new PIXI.ScalableStage(0x000000, interactive);
    this.stages.rules.name = "Rules stage";
    this.stages.score = new PIXI.ScalableStage(0x000000, interactive);
    this.stages.score.name = "Score stage";

    this.stageName = 'menu';
    this.stage = this.stages[this.stageName];

    /** Names of all the stages that form the menu. */
    this.menuStageNames = ['menu', 'rules', 'score', 'gameOver'];

    this.stageShownListeners = {};
    this.stageHiddenListeners = {};
    for (var stage in this.stages) {
        this.stageShownListeners[stage] = [];
        this.stageHiddenListeners[stage] = [];
    }

    // sound & music muting
    this.soundMuted = null;
    this.muteSoundSprite = null;
    this.muteSoundCross = null;
    this.musicMuted = null;
    this.muteMusicSprite = null;
    this.muteMusicCross = null;

    // renderer setup
    this.renderer = PIXI.autoDetectRenderer(this.rendererWidth, this.rendererHeight, null, true);
    this.GAME_CONTAINER.appendChild(this.renderer.view);

    this.useWebGl = (this.renderer instanceof PIXI.WebGLRenderer);

    /**
     * The time of the game.
     *
     * @property
     *
     * @public
     * @readonly
     * @type {DeerHuhn.GameTime}
     */
    this.gameTime = null;

    this.points = 0;

    // the number of ammunition available
    this.ammo = this.MAX_AMMO;
    // true if the ammo is reloading (cannot shoot)
    this.reloadingAmmo = false;

    // pausing
    this.isPaused = false;
    this.pauseStartTime = null;
    this.pausableObjects = [];
    /** The timer managing the timeout when unpausing. */
    this.unPauseCountdownTimer = null;
    this.unPauseCountdownDigits = [];
    /** The mask used for overlaying the game when paused. */
    this.pauseMask = null;

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
    this.stages.game.click = function (mouse) {
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
        } else if (PIXI.Keys.isKeyPressed(PIXI.Keys.keyCodes.esc)) {
            this.changeStage('menu'); // TODO dev code
        } else if (PIXI.Keys.isKeyPressed(48)) { // 0/é key on cs keyboard
            this.gameTime.increaseDate(); // TODO dev code
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
        this.loadingElem.style.display = "none";

        this.loadPersistentState();

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
            this.stages.game.addChild(this.backgroundLayers[i]);
        }

        // add the false background in foreground (for displaying points above all layers)
        for (var i=11; i >= 6; i--) {
            this.backgroundLayers[i] = new PIXI.DisplayObjectContainer();
            this.backgroundLayers[i].name = "False background " + (i-6);
            this.backgroundLayers[i].width = this.backgroundLayers[i-6].width;
            this.backgroundLayers[i].height = this.backgroundLayers[i-6].height;
            this.stages.game.addChild(this.backgroundLayers[i]);
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

        this.initMuteButtons();

        this.initStages();

        this.initHUD(1.15 * this.muteMusicSprite.width);

        this.initSounds();

        this.resize();

        for (var stage in this.stages) {
            var hiddenListeners = this.stageHiddenListeners[stage];
            for (var i=0; i<hiddenListeners.length; i++)
                hiddenListeners[i].call(this);
        }
        var shownListeners = this.stageShownListeners[this.stageName];
        for (var i=0; i<shownListeners.length; i++)
            shownListeners[i].call(this);

        requestAnimFrame(this.animate.bind(this));
    },

    /**
     * Load all data saved to cookies or other type of storage.
     */
    loadPersistentState: function () {
        this.soundMuted = cookie.get('soundMuted', '0') !== '0';
        this.musicMuted = cookie.get('musicMuted', '0') !== '0';
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

    initMuteButtons: function() {
        // all sounds muting
        this.muteSoundSprite = new PIXI.Sprite(PIXI.TextureCache['sound.png']);
        this.muteSoundSprite.interactive = true;
        this.muteSoundSprite.buttonMode = true;
        this.muteSoundSprite.scale.x = this.muteSoundSprite.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
        this.muteSoundSprite.onresize = function () {
            this.muteSoundSprite.position.x = 0.99*this.rendererWidth/this.renderingScale - this.muteSoundSprite.width;
            this.muteSoundSprite.position.y = 0.99*this.rendererHeight/this.renderingScale - this.muteSoundSprite.height;
        }.bind(this);
        this.addSprite(this.muteSoundSprite);

        this.muteSoundCross = new PIXI.Sprite(PIXI.TextureCache['naboje-zadne.png']);
        this.muteSoundCross.visible = true;
        this.muteSoundCross.scale.x = this.muteSoundCross.scale.y = 0.85;
        this.muteSoundCross.anchor.x = this.muteSoundCross.anchor.y = 0.5;
        this.muteSoundCross.position = new PIXI.Point(this.muteSoundSprite.width, this.muteSoundSprite.height);
        this.muteSoundSprite.addChild(this.muteSoundCross);

        this.muteSoundSprite.click = function () {
            this.setSoundMuted(!this.soundMuted);
            return false;
        }.bind(this);

        // background music muting
        this.muteMusicSprite = new PIXI.Sprite(PIXI.TextureCache['music.png']);
        this.muteMusicSprite.interactive = true;
        this.muteMusicSprite.buttonMode = true;
        this.muteMusicSprite.scale.x = this.muteMusicSprite.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
        this.muteMusicSprite.onresize = function () {
            this.muteMusicSprite.position.x = 0.99*this.rendererWidth/this.renderingScale - this.muteMusicSprite.width;
            this.muteMusicSprite.position.y = 0.98*DeerHuhn.SCENE_HEIGHT - this.muteMusicSprite.height - this.muteSoundSprite.height;
        }.bind(this);
        this.addSprite(this.muteMusicSprite);

        this.muteMusicCross = new PIXI.Sprite(PIXI.TextureCache['naboje-zadne.png']);
        this.muteMusicCross.visible = true;
        this.muteMusicCross.scale.x = this.muteMusicCross.scale.y = 0.85;
        this.muteMusicCross.anchor.x = this.muteMusicCross.anchor.y = 0.5;
        this.muteMusicCross.position = new PIXI.Point(this.muteMusicSprite.width, this.muteMusicSprite.height);
        this.muteMusicSprite.addChild(this.muteMusicCross);

        this.muteMusicSprite.click = function () {
            this.setMusicMuted(!this.musicMuted);
            return false;
        }.bind(this);
    },

    initStages: function() {
        // init the stages
        this.initGameStage();
        this.initMenuStage();
        this.initRulesStage();
        this.initScoreStage();
        this.initGameOverStage();

        // let the menu music not stop when switching between menu stages
        var hiddenCallback = function(newStageName) {
            if (this.menuStageNames.indexOf(newStageName) === -1)
                this.sounds.menuTheme.pause();
        }.bind(this);
        var shownCallback = function(oldStageName) {
            if (this.menuStageNames.indexOf(oldStageName) === -1)
                this.sounds.menuTheme.play();
        }.bind(this);

        for (var i=0; i<this.menuStageNames.length; i++) {
            var stageName = this.menuStageNames[i];
            this.stageHiddenListeners[stageName].push(hiddenCallback);
            this.stageShownListeners[stageName].push(shownCallback);
        }

        var muteButtonsCallback = function () {
            this.stage.addChild(this.muteSoundSprite);
            this.stage.addChild(this.muteMusicSprite);
        };
        // we don't have to remove sound and music muting sprites, since adding a sprite under a new parent automatically disconnects it from the old one

        for (var stageName in this.stages) {
            this.stageShownListeners[stageName].push(muteButtonsCallback);
        }
    },

    initGameStage: function() {

        //HACK: the interaction manager sets cursor to "pointer" in every update call, so we revert this change afterwards
        var oldUpdate = this.stages.game.interactionManager.update;
        this.stages.game.interactionManager.update = function() {
            oldUpdate.call(this.stages.game.interactionManager);

            // only change the default cursor to crosshair
            if (this.renderer.view.style.cursor === 'default')
                this.renderer.view.style.cursor = "url('images/crosshair-small.cur'), crosshair";
        }.bind(this);

        this.stageHiddenListeners.game.push(function() {
            this.sounds.mainTheme.pause();
            this.pausableObjects.remove(this.gameTime);

            this.spawnTimer.stop();
        }.bind(this));

        this.stageShownListeners.game.push(function() {
            this.sounds.mainTheme.play();
            this.points = 0;
            this.ammo = this.MAX_AMMO;
            this.scrollPercentage = 0.0;

            // remove legal animals
            for (var i=this.animals.length-1; i>=0; i--) {
                this.removeAnimal(this.animals[i]);
            }
            this.animalFactory.occupiedPositions = [];
            this.animalFactory.occupiedPaths = [];

            var dateChangeCallback = function () {
                this.updateDate();
                this.updateDontShootSigns();
            }.bind(this);

            var gameOverCallback = function () {
                console.log('Game over!'); //TODO development code
                this.changeStage('gameOver');
            }.bind(this);
            this.gameTime = new DeerHuhn.GameTime(dateChangeCallback, gameOverCallback);
            this.pausableObjects.push(this.gameTime);
            this.gameTime.start();

            this.initAnimals();
            this.spawnTimer.start();
            this.updateDate();
            this.updatePoints();
            this.updateAmmo();
            this.updateDontShootSigns();

            this.pause();
            this.unPause();
        }.bind(this));

        // spawn every day
        this.spawnTimer = new DeerHuhn.PausableInterval(this.spawnRandomAnimals.bind(this), 600);
        this.pausableObjects.push(this.spawnTimer);
    },

    createMenuBackgroundSprite: function () {
        var background = PIXI.Sprite.fromImage('images/menu-pozadi.png');
        background.anchor.x = 0.5;
        background.position.y = 0;
        background.onresize = function () {
            background.position.x = 0.5*this.rendererWidth/this.renderingScale;
        }.bind(this);
        
        return background;
    },

    initMenuStage: function() {
        // the background image
        var background = this.createMenuBackgroundSprite();
        this.stages.menu.addChild(background);
        this.addSprite(background);

        // the foreground image
        var foreground = new PIXI.Sprite(PIXI.TextureCache['uvodni_obrazek.png']);
        foreground.interactive = true;
        foreground.anchor.x = 0.5;
        foreground.position.y = 0;
        foreground.onresize = function () {
            // do not allow the left edge to go out of view
            foreground.position.x = Math.max(0.5*foreground.width, 0.5*this.rendererWidth/this.renderingScale);
        }.bind(this);

        this.stages.menu.addChild(foreground);
        this.addSprite(foreground);

        var linkFontSize = '57px';

        // link to www.fld.czu.cz
        var linkWWW = new PIXI.DisplayObjectContainer();
        linkWWW.interactive = true;
        linkWWW.buttonMode = true;

        var linkWWW1 = new PIXI.Text('www.', {font: linkFontSize+' HelveticaLightBold', fill: '#336666'});
        linkWWW.addChild(linkWWW1);
        var linkWWW2 = new PIXI.Text('fld.czu.cz', {font: linkFontSize+' HelveticaBlack', fill: '#336666'});
        linkWWW.addChild(linkWWW2);
        linkWWW2.position.x = linkWWW1.width;

        linkWWW.position = new PIXI.Point(105 - 0.5*foreground.width, 795);
        linkWWW.rotation = -3*Math.PI/180;

        linkWWW.click = function (mouse) {
            document.getElementById('wwwLink').click(mouse.originalEvent);
        };

        foreground.addChild(linkWWW);
        this.addSprite(linkWWW);

        // link to Facebook
        linkFontSize = '50px';

        var linkFB = new PIXI.DisplayObjectContainer();
        linkFB.interactive = true;
        linkFB.buttonMode = true;

        var linkFB1 = new PIXI.Text('facebook.com/', {font: linkFontSize+' HelveticaLightBold', fill: '#339966'});
        linkFB.addChild(linkFB1);
        var linkFB2 = new PIXI.Text('fld.czu.cz', {font: linkFontSize+' HelveticaBlack', fill: '#339966'});
        linkFB.addChild(linkFB2);
        linkFB2.position.x = linkFB1.width;

        linkFB.position = new PIXI.Point(105 - 0.5*foreground.width, 865);
        linkFB.rotation = -3*Math.PI/180;

        linkFB.click = function (mouse) {
            document.getElementById('fbLink').click(mouse.originalEvent);
        };

        foreground.addChild(linkFB);
        this.addSprite(linkFB);

        // PLAY button
        var playDarkTexture = PIXI.TextureCache['hrat_tm.png'];
        var playLightTexture = PIXI.TextureCache['hrat_sv.png'];
        var playBtn = new PIXI.Sprite(playDarkTexture);
        playBtn.interactive = true;
        playBtn.buttonMode = true;
        playBtn.position = new PIXI.Point(60 - 0.5*foreground.width, 630);
        playBtn.scale.x = playBtn.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;

        playBtn.click = function (mouse) {
            this.changeStage('game');
        }.bind(this);
        playBtn.mouseover = function (mouse) {
            playBtn.setTexture(playLightTexture);
        };
        playBtn.mouseout = function (mouse) {
            playBtn.setTexture(playDarkTexture);
        };

        foreground.addChild(playBtn);
        this.addSprite(playBtn);

        // RULES button
        var rulesDarkTexture = PIXI.TextureCache['pravidla_tm.png'];
        var rulesLightTexture = PIXI.TextureCache['pravidla_sv.png'];
        var rulesBtn = new PIXI.Sprite(rulesDarkTexture);
        rulesBtn.interactive = true;
        rulesBtn.buttonMode = true;
        rulesBtn.position = new PIXI.Point(240 - 0.5*foreground.width, 630);
        rulesBtn.scale.x = rulesBtn.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;

        rulesBtn.click = function (mouse) {
            this.changeStage('rules');
        }.bind(this);
        rulesBtn.mouseover = function (mouse) {
            rulesBtn.setTexture(rulesLightTexture);
        };
        rulesBtn.mouseout = function (mouse) {
            rulesBtn.setTexture(rulesDarkTexture);
        };

        foreground.addChild(rulesBtn);
        this.addSprite(rulesBtn);

        // SCORE button
        var scoreDarkTexture = PIXI.TextureCache['skore_tm.png'];
        var scoreLightTexture = PIXI.TextureCache['skore_sv.png'];
        var scoreBtn = new PIXI.Sprite(scoreDarkTexture);
        scoreBtn.interactive = true;
        scoreBtn.buttonMode = true;
        scoreBtn.position = new PIXI.Point(540 - 0.5*foreground.width, 632);
        scoreBtn.scale.x = scoreBtn.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;

        scoreBtn.click = function (mouse) {
            this.changeStage('score');
        }.bind(this);
        scoreBtn.mouseover = function (mouse) {
            scoreBtn.setTexture(scoreLightTexture);
        };
        scoreBtn.mouseout = function (mouse) {
            scoreBtn.setTexture(scoreDarkTexture);
        };

        foreground.addChild(scoreBtn);
        this.addSprite(scoreBtn);
    },

    initRulesStage: function() {

        // the background image
        var background = this.createMenuBackgroundSprite();
        this.stages.rules.addChild(background);
        this.addSprite(background);

        // the caption
        var caption = new PIXI.Text('PRAVIDLA', {font: '100px HelveticaBlack', fill: '#E9FBC2', stroke: '#808888', strokeThickness: 3});
        caption.anchor.x = 0.5;
        caption.position = new PIXI.Point(0, 120);

        background.addChild(caption);
        this.addSprite(caption);

        // the rules text
        var rulesText = "Pravidla hry Na posedu jsou následující:<ol id=\"rules\">"+
            "<li>hra trvá od 1. března do 30. listopadu</li>"+
            "<li>zvířata střílej podle doby lovu:<table border=0 cellspacing=10>"+
            "<tr><td>liška</td><td>celoročně</td></tr>"+
            "<tr><td>sele</td><td>celoročně</td></tr>"+
            "<tr><td>kachna</td><td>01.09. - 30.11.</td></tr>"+
            "<tr><td>srnec</td><td>16.05. - 30.09.</td></tr>"+
            "<tr><td>prase</td><td>01.08. - 31.12.</td></tr>"+
            "</table></li>"+
            "<li>nestřílej hospodářská zvířata</li>"+
            "<li>nepáchej škody na majetku</li>"+
            "<li>hledej bonusy</li>"+
            "</ol>"+
            "Lovu zdar!";

        var rulesRect = new PIXI.Graphics();
        rulesRect.beginFill(0xFFFFFF, 0.5);
        var rulesRectSize = new PIXI.Point(800, 480);
        rulesRect.drawRect(0, 0, rulesRectSize.x, rulesRectSize.y);
        rulesRect.endFill();
        rulesRect.position = new PIXI.Point(-0.5*rulesRectSize.x, 270);

        background.addChild(rulesRect);
        this.addSprite(rulesRect); // not a sprite

        var container = this.renderer.view.parentNode;
        var rulesHTML = document.createElement('p');
        rulesHTML.innerHTML = rulesText;
        rulesHTML.style.position = 'absolute';
        rulesHTML.style.textAlign = 'left';
        rulesHTML.style.overflow = 'auto';
        rulesHTML.style.margin = '0px';
        rulesHTML.style.padding = '0px';
        container.appendChild(rulesHTML);
        rulesRect.onresize = function () {
            var padding = 3; //px
            rulesHTML.style.left = (rulesRect.worldTransform[2] + this.renderer.view.offsetLeft + padding) + 'px';
            rulesHTML.style.top = (rulesRect.worldTransform[5] + this.renderer.view.offsetTop + padding) + 'px';
            rulesHTML.style.width = (rulesRectSize.x * this.renderingScale - 2*padding) + 'px';
            rulesHTML.style.height = (rulesRectSize.y * this.renderingScale - 2*padding) + 'px';
            var fontSize = Math.round(50* this.renderingScale);
            rulesHTML.style.font = fontSize+'px/1.5 HelveticaLight';
        }.bind(this);
        this.stageShownListeners.rules.push(function () {
            rulesHTML.style.display = 'block';
        });
        this.stageHiddenListeners.rules.push(function () {
            rulesHTML.style.display = 'none';
        });

        // the BACK button
        var backBtn = new PIXI.Text('← MENU  ', {font: '80px HelveticaBlack', fill: '#336666'});
        backBtn.interactive = true;
        backBtn.buttonMode = true;
        backBtn.anchor.x = 0.5;
        backBtn.position = new PIXI.Point(0, 800);

        backBtn.click = function (mouse) {
            this.changeStage('menu');
        }.bind(this);

        background.addChild(backBtn);
        this.addSprite(backBtn);
    },

    initScoreStage: function() {
        // the background image
        var background = this.createMenuBackgroundSprite();
        this.stages.score.addChild(background);
        this.addSprite(background);

        // the caption
        var caption = new PIXI.Text('SKÓRE', {font: '100px HelveticaBlack', fill: '#E9FBC2', stroke: '#808888', strokeThickness: 3});
        caption.anchor.x = 0.5;
        caption.position = new PIXI.Point(0, 120);

        background.addChild(caption);
        this.addSprite(caption);

        // the rules text
        var scoreText = "<table width=\"100%\" cellspacing=0><tr><th colspan=2 width=\"50%\">MYSLIVECKÁ ELITA</th><th colspan=2>MYSLIVECKÁ JELITA</th></tr>\n"+
            "<tr><td>Honza Macků</td><td>300</td><td>Onřej Fudaly</td><td>-450</td></tr>\n"+
            "<tr><td>Karel Boublík</td><td>298</td><td>Jaroslav Petruželka</td><td>-430</td></tr></table>";

        var scoreRect = new PIXI.Graphics();
        scoreRect.beginFill(0xFFFFFF, 0.5);
        var scoreRectSize = new PIXI.Point(1400, 480);
        scoreRect.drawRect(0, 0, scoreRectSize.x, scoreRectSize.y);
        scoreRect.endFill();
        scoreRect.position = new PIXI.Point(-0.5*scoreRectSize.x, 270);

        background.addChild(scoreRect);
        this.addSprite(scoreRect); // not a sprite

        var container = this.renderer.view.parentNode;
        var scoreHTML = document.createElement('p');
        scoreHTML.innerHTML = scoreText;
        scoreHTML.style.position = 'absolute';
        scoreHTML.style.textAlign = 'left';
        scoreHTML.style.overflow = 'auto';
        scoreHTML.style.margin = '0px';
        scoreHTML.style.padding = '0px';
        container.appendChild(scoreHTML);
        scoreRect.onresize = function () {
            var padding = 3; //px
            scoreHTML.style.left = (scoreRect.worldTransform[2] + this.renderer.view.offsetLeft + padding) + 'px';
            scoreHTML.style.top = (scoreRect.worldTransform[5] + this.renderer.view.offsetTop + padding) + 'px';
            scoreHTML.style.width = (scoreRectSize.x * this.renderingScale - 2*padding) + 'px';
            scoreHTML.style.height = (scoreRectSize.y * this.renderingScale - 2*padding) + 'px';
            var fontSize = Math.round(50* this.renderingScale);
            scoreHTML.style.font = fontSize+'px/1.5 HelveticaLight';
        }.bind(this);
        this.stageShownListeners.score.push(function () {
            scoreHTML.style.display = 'block';
        });
        this.stageHiddenListeners.score.push(function () {
            scoreHTML.style.display = 'none';
        });

        // the BACK button
        var backBtn = new PIXI.Text('← MENU  ', {font: '80px HelveticaBlack', fill: '#336666'});
        backBtn.interactive = true;
        backBtn.buttonMode = true;
        backBtn.anchor.x = 0.5;
        backBtn.position = new PIXI.Point(0, 800);

        backBtn.click = function (mouse) {
            this.changeStage('menu');
        }.bind(this);

        background.addChild(backBtn);
        this.addSprite(backBtn);
    },

    initGameOverStage: function() {
        // the background image
        var background = this.createMenuBackgroundSprite();
        this.stages.gameOver.addChild(background);
        this.addSprite(background);

        // the caption
        var caption = new PIXI.Text('TVOJE SKÓRE', {font: '100px HelveticaBlack', fill: '#E9FBC2', stroke: '#808888', strokeThickness: 3, align: 'center'});
        caption.anchor.x = 0.5;
        caption.position = new PIXI.Point(0, 120);
        this.stageShownListeners.gameOver.push(function() {
            caption.setText('TVOJE SKÓRE\n' + this.points + " bodů");
        }.bind(this));

        background.addChild(caption);
        this.addSprite(caption);

        // the rules text
        var formText = '<table width="100%"><tr><td><label for="name">Jméno: </label></td><td width="100%"><input name="name" style="background-color: transparent; width: 95%" maxlength="255"/></td></tr>'+"\n"+
            '<tr><td><label for="email">Email: </label></td><td><input name="email" style="background-color: transparent; width: 95%" maxlength="255"/></td></tr></table>';

        var formRect = new PIXI.Graphics();
        formRect.beginFill(0xFFFFFF, 0.5);
        var formRectSize = new PIXI.Point(800, 200);
        formRect.drawRect(0, 0, formRectSize.x, formRectSize.y);
        formRect.endFill();
        formRect.position = new PIXI.Point(-0.5*formRectSize.x, 470);

        background.addChild(formRect);
        this.addSprite(formRect); // not a sprite

        var container = this.renderer.view.parentNode;
        var formHTML = document.createElement('form');
        formHTML.innerHTML = formText;
        formHTML.style.position = 'absolute';
        formHTML.style.textAlign = 'left';
        formHTML.style.overflow = 'auto';
        formHTML.style.margin = '0px';
        formHTML.style.padding = '0px';
        container.appendChild(formHTML);
        formRect.onresize = function () {
            var padding = 3; //px
            formHTML.style.left = (formRect.worldTransform[2] + this.renderer.view.offsetLeft + padding) + 'px';
            formHTML.style.top = (formRect.worldTransform[5] + this.renderer.view.offsetTop + padding) + 'px';
            formHTML.style.width = (formRectSize.x * this.renderingScale - 2*padding) + 'px';
            formHTML.style.height = (formRectSize.y * this.renderingScale - 2*padding) + 'px';
            var fontSize = Math.round(50* this.renderingScale);
            formHTML.style.font = fontSize+'px/1.5 HelveticaLight';
        }.bind(this);
        this.stageShownListeners.gameOver.push(function () {
            formHTML.style.display = 'block';
        });
        this.stageHiddenListeners.gameOver.push(function () {
            formHTML.style.display = 'none';
        });

        // the SAVE button
        var saveBtn = new PIXI.Text('ULOŽIT VÝSLEDEK', {font: '80px HelveticaBlack', fill: '#336666'});
        saveBtn.interactive = true;
        saveBtn.buttonMode = true;
        saveBtn.anchor.x = 0.5;
        saveBtn.position = new PIXI.Point(0, 800);

        saveBtn.click = function (mouse) {
            console.log('score submitted'); // TODO dev code
            saveBtn.setText('UKLÁDÁM');
            setTimeout(this.changeStage.bind(this, 'score'), 2000); // TODO call this from callback when the score gets saved
        }.bind(this);

        this.stageShownListeners.gameOver.push(function () {
            saveBtn.setText('ULOŽIT VÝSLEDEK');
        });

        background.addChild(saveBtn);
        this.addSprite(saveBtn);
    },

    changeStage: function(newStageName) {
        if (this.stageName === newStageName)
            return;

        var oldStageName = this.stageName;
        var oldStage = this.stage;

        var hiddenListeners = this.stageHiddenListeners[oldStageName];
        for (var i=0; i<hiddenListeners.length; i++)
            hiddenListeners[i].call(this, newStageName);

        // create a fade-out transition
        var interval = setInterval(function (oldStage) {
            oldStage.alpha -= 0.05;
        }.bind(this, oldStage), 30);

        // stop the transition interval when transition is done
        setTimeout(function (interval, newStageName, oldStageName) {
            clearInterval(interval);

            this.stageName = newStageName;
            this.stage = this.stages[newStageName];
            this.stage.alpha = 1;

            var shownListeners = this.stageShownListeners[newStageName];
            for (var i=0; i<shownListeners.length; i++)
                shownListeners[i].call(this, oldStageName);

            this.resize();
        }.bind(this, interval, newStageName, oldStageName), 600);
    },

    initHUD: function(occupiedWidthLowerRight) {
        var ignoreClicksCallback = function () {
            return false;
        };

        var pointsDate = new PIXI.Sprite(PIXI.TextureCache['datum_body.png']);
        pointsDate.scale.x = pointsDate.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
        pointsDate.interactive = true;
        pointsDate.click = ignoreClicksCallback;
        pointsDate.onresize = function () {
            pointsDate.position.x = 0.99*this.rendererWidth/this.renderingScale - pointsDate.width - occupiedWidthLowerRight;
            pointsDate.position.y = 0.99*this.rendererHeight/this.renderingScale - pointsDate.height;
        }.bind(this);

        this.addSprite(pointsDate);
        this.stages.game.addChild(pointsDate);

        // date
        
        this.dateText = new PIXI.Text(' 1. 3.', {font: '120px HelveticaLight', fill: '#8E8D5B'});

        this.addSprite(this.dateText);
        pointsDate.addChild(this.dateText);

        // points
        
        this.pointsText = new PIXI.Text('0', {font: 'bold 120px HelveticaBlack'});

        this.addSprite(this.pointsText);
        pointsDate.addChild(this.pointsText);

        // ammo

        var ammoResize = function (bullet, i) {
            bullet.position.x = 0.99*this.rendererWidth/this.renderingScale - 1.1*pointsDate.width - occupiedWidthLowerRight - (i+1)*(1.1*bullet.width);
            bullet.position.y = 0.99*this.rendererHeight/this.renderingScale - bullet.height;
        }.bind(this);

        for (var i=0; i < this.MAX_AMMO; i++) {
            var bullet = new PIXI.Sprite(PIXI.TextureCache['naboj.png']);
            bullet.scale.x = bullet.scale.y = DeerHuhn.BASIC_ANIMAL_SCALE;
            bullet.interactive = true;
            bullet.click = ignoreClicksCallback;
            bullet.onresize = ammoResize.bind(null, bullet, i);

            this.addSprite(bullet);
            this.stages.game.addChild(bullet);
            this.bulletSprites[i] = bullet;
        }

        var noAmmo = new PIXI.Sprite(PIXI.TextureCache['naboje-zadne.png']);
        noAmmo.interactive = true;
        noAmmo.click = ignoreClicksCallback;
        noAmmo.onresize = ammoResize.bind(null, noAmmo, 0);

        this.addSprite(noAmmo);
        this.stages.game.addChild(noAmmo);
        this.noAmmoSprite = noAmmo;

        // "situations" - what is allowed to shoot at
        
        var allowedShooting = new PIXI.Sprite(PIXI.TextureCache['situace.png']);
        allowedShooting.interactive = false;
        allowedShooting.scale.x = allowedShooting.scale.y = 0.8;
        allowedShooting.onresize = function () {
            allowedShooting.position.x = 0.99*this.rendererWidth/this.renderingScale - allowedShooting.width;
            allowedShooting.position.y = 0.05*this.rendererHeight/this.renderingScale;
        }.bind(this);

        this.addSprite(allowedShooting);
        this.stages.game.addChild(allowedShooting);

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
            var digit = new PIXI.Text((numCountDownDigits-i)+'', {font: '240px HelveticaBlack', fill: 'black'});
            digit.visible = false;
            
            digit.onresize = countDownDigitOnResize.bind(this, i);

            this.unPauseCountdownDigits.push(digit);
            this.addSprite(digit);
            this.stages.game.addChild(digit);
        }

        var mask = new PIXI.Graphics();
        mask.beginFill(0x000000, 0.5);
        mask.drawRect(0, 0, 5000, 5000);
        mask.endFill();

        this.pauseMask = mask;
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
            autoplay: false,
            loop: true,
            volume: 1
        });

        this.sounds.menuTheme = new DeerHuhn.SingletonSoundSample({
            urls: this.getSoundFiles('sound/hudba_menu'),
            autoplay: false,
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

        this.setSoundMuted(this.soundMuted, true);
        this.setMusicMuted(this.musicMuted, true);
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
        this.addAnimal(this.animalFactory.createKura(this.staticObjectOnShotCallback));

        var numMushrooms = randInt(0, 3);
        for (var i=0; i < numMushrooms; i++) {
            this.addAnimal(this.animalFactory.createChoros(this.staticObjectOnShotCallback));
        }
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

    addAnimal: function(animal, animalToAddBefore) {
        // this happens when there is no free path for the animal
        if (animal === null)
            return;

        var layer = this.backgroundLayers[animal.scenePosition.layer];
        if (animalToAddBefore === undefined) {
            layer.addChild(animal.sprite);
        } else {
            var parentIndex = layer.children.indexOf(animalToAddBefore.sprite);
            if (parentIndex < 0) {
                // the parent was killed before this animal has been spawned
                layer.addChild(animal.sprite);
            } else {
                layer.addChildAt(animal.sprite, parentIndex);
            }
        }
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

                if (childToSpawn.addUnderParent)
                    this.addAnimal(childToSpawn.animal, animal);
                else
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
                    if (animal.onHidden !== undefined)
                        animal.onHidden();
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

    setSoundMuted: function (shouldMute, forceEvenIfSame) {
        var changedMuting = (shouldMute !== this.soundMuted);
        this.soundMuted = shouldMute;
        this.muteSoundCross.visible = this.soundMuted;
        this.muteMusicCross.visible = this.musicMuted || this.soundMuted;

        if (!changedMuting && (forceEvenIfSame === undefined || !forceEvenIfSame))
            return;

        cookie.set('soundMuted', shouldMute ? 1 : 0);

        if (this.soundMuted)
            Howler.mute();
        else
            Howler.unmute();
    },

    setMusicMuted: function (shouldMute, forceEvenIfSame) {
        var changedMuting = (shouldMute !== this.musicMuted);
        this.musicMuted = shouldMute;
        this.muteMusicCross.visible = this.musicMuted || this.soundMuted;

        if (!changedMuting && (forceEvenIfSame === undefined || !forceEvenIfSame))
            return;

        cookie.set('musicMuted', shouldMute ? 1 : 0);

        if (this.musicMuted) {
            this.sounds.mainTheme.mute();
            this.sounds.menuTheme.mute();
        } else {
            this.sounds.mainTheme.unmute();
            this.sounds.menuTheme.unmute();
        }
    },

    initializeImages: function() {
        var assets = [
            'HelveticaLight.webfont',
            'HelveticaLightBold.webfont',
            'HelveticaBlack.webfont',
            'images/sprites-menu.json',
            'images/menu-pozadi.png',
            'images/vrstva0.png', 
            'images/vrstva1.png', 
            'images/vrstva2.png', 
            'images/vrstva3.png', 
            'images/vrstva4.png', 
            'images/vrstva5.png', 
            'images/sprites-interactive.json', 
            'images/sprites-passive.json'
        ];
        var loader = new PIXI.FontAwareAssetLoader(assets);
        loader.onProgress = this.onAssetLoaderProgress.bind(this, loader);
        loader.onComplete = this.onLoad.bind(this);
        loader.load();
    },

    onAssetLoaderProgress: function (loader) {
        var total = loader.assetURLs.length;
        var numLoaded = total - loader.loadCount;
        this.loadingElem.innerHTML = 'Načítání ' + numLoaded + "/" + total;
    },

    resize: function() {
        this.rendererWidth = this.GAME_CONTAINER.offsetWidth - 8;
        this.rendererHeight = Math.min(this.GAME_CONTAINER.offsetHeight - 8, this.MAX_HEIGHT);
        this.renderingScale = this.rendererHeight/this.MAX_HEIGHT;

        this.renderer.resize(this.rendererWidth, this.rendererHeight);

        // the scaling propagates to children
        for (var stageName in this.stages) {
            var stage = this.stages[stageName];
            stage.scale.x = stage.scale.y = this.renderingScale; 
        }

        for (var i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i].onresize !== undefined) {
                this.sprites[i].onresize();
            }
        }

        for (var stageName in this.stages) {
            var stage = this.stages[stageName];
            stage.updateTransform();
        }
    },

    pause: function() {
        // can be null at startup in IE, but that doesn't matter
        if (this.pauseMask === undefined || this.pauseMask === null)
            return;

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

        this.stages.game.addChild(this.pauseMask);

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

        // can be null at startup in IE, but that doesn't matter
        if (this.pauseMask === undefined || this.pauseMask === null)
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
                    this.stages.game.removeChild(this.pauseMask);

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
    this.stopped = false;
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

DeerHuhn.ScenePosition.prototype.equals = function(other) {
    return this.layer === other.layer && this.x === other.x && this.y === other.y;
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
    },

    equals: function (other) {
        return this.layer === other.layer && this.startPosition.equals(other.startPosition) && this.endPosition.equals(other.endPosition);
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
 * @param {boolean} addUnderParent If true, the child should be added under its parent in the layer order.
 */
DeerHuhn.AnimalToSpawn = function (animal, delay, addUnderParent) {
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

    /**
     * If true, the child should be added under its parent in the layer order.
     * 
     * @property
     * @public
     * @readonly
     * @type {boolean}
     */
    this.addUnderParent = (addUnderParent !== undefined) ? addUnderParent : false;
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
    /**
     * The paths used by some animals this time.
     * @property
     *
     * @protected
     * @readonly (contents can change)
     * @type {DeerHuhn.ScenePath[]}
     */
    this.occupiedPaths = [];

    /**
     * The positions used by some static objects this time.
     * @property
     *
     * @protected
     * @readonly (contents can change)
     * @type {DeerHuhn.ScenePosition[]}
     */
    this.occupiedPositions = [];
};

/**
 * Choose a random object from the given set excluding objects present in occupied.
 *
 * If both objects from #objects and #occupied support the #equals method, they are compared using that one.
 *
 * @param {Object[]} objects Objects to choose from.
 * @param {Object[]} occupied The objects treated as occupied.
 * @return {Object} A random object from the given list.
 */
DeerHuhn.Animals.AnimalFactory.prototype.getRandomObject = function(objects, occupied) {
    if (objects.length === 0)
        return null;

    var availableObjects = [];

    if (occupied.length > 0) {
        var equalsAvailable = objects[0].equals !== undefined && occupied[0].equals !== undefined;
        var indexOf;
        if (equalsAvailable)
            indexOf = Array.prototype.indexOfUsingEquals;
        else
            indexOf = Array.prototype.indexOf;

        // TODO possibly inefficient
        for (var i=0; i < objects.length; i++) {
            if (indexOf.call(occupied, objects[i]) < 0)
                availableObjects.push(objects[i]);
        }
    } else {
        availableObjects = objects;
    }
    
    if (availableObjects.length === 0)
        return null;

    var randPositionIdx = randInt(0, availableObjects.length-1);
    return availableObjects[randPositionIdx];
};


/**
 * Choose a random path from the given set. The path must be unoccupied (occupied paths in #occupiedPaths).
 *
 * @param {...DeerHuhn.ScenePath[]} paths All possible paths to choose from.
 * @return {DeerHuhn.ScenePath} A random path from the given lists (might have reversed direction). Null, if there is no unoccupied path.
 */
DeerHuhn.Animals.AnimalFactory.prototype.getRandomPath = function(paths) {
    var argPaths = Array.prototype.concat.apply([], arguments);
    var path = this.getRandomObject(argPaths, this.occupiedPaths);

    if (path === null)
        return null;

    if (Math.random() > 0.5)
        path = path.reverse();

    return path;
};

/**
 * Set the given path as occupied.
 *
 * @param {DeerHuhn.ScenePath} path The path to set as occupied.
 */
DeerHuhn.Animals.AnimalFactory.prototype.occupyPath = function(path) {
    this.occupiedPaths.push(path);
    this.occupiedPaths.push(path.reverse());
};

/**
 * Set the given path as free.
 *
 * @param {DeerHuhn.ScenePath} path The path to set as free.
 */
DeerHuhn.Animals.AnimalFactory.prototype.freePath = function(path) {
    this.occupiedPaths.removeUsingEquals(path);
    this.occupiedPaths.removeUsingEquals(path.reverse());
};

/**
 * Choose a random position from the given set. The position must be unoccupied (occupied positions in #occupiedPositions).
 *
 * @param {...DeerHuhn.ScenePosition[]} positions All possible positions to choose from.
 * @return {DeerHuhn.ScenePosition} A random positions from the given lists. Null, if there is no unoccupied position.
 */
DeerHuhn.Animals.AnimalFactory.prototype.getRandomPosition = function(positions) {
    var argPositions = Array.prototype.concat.apply([], arguments);
    return this.getRandomObject(argPositions, this.occupiedPositions);
};

/**
 * Set the given position as occupied.
 *
 * @param {DeerHuhn.ScenePosition} position The position to set as occupied.
 */
DeerHuhn.Animals.AnimalFactory.prototype.occupyPosition = function(position) {
    this.occupiedPositions.push(position);
};

/**
 * Set the given position as free.
 *
 * @param {DeerHuhn.ScenePosition} position The position to set as free.
 */
DeerHuhn.Animals.AnimalFactory.prototype.freePosition = function(position) {
    this.occupiedPositions.removeUsingEquals(position);
};

/**
 * Wrap the given movementFinishedCallback to make the animal's path free after the animal disappears.
 *
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the animal disappears.
 */
DeerHuhn.Animals.AnimalFactory.prototype.wrapMovementFinishedCallback = function(movementFinishedCallback) {
    return function (animal) {
        this.freePath(animal.scenePath);
        movementFinishedCallback.call(null, animal);
    }.bind(this);
};

/**
 * Wrap the given onShotCallback to make the animal's path free after the animal is shot.
 *
 * @param {onShotCallback} onShotCallback The callback to call when the animal is shot.
 */
DeerHuhn.Animals.AnimalFactory.prototype.wrapOnShotCallback = function(onShotCallback) {
    return function (animal) {
        this.freePosition(animal.scenePosition);
        onShotCallback.call(null, animal);
    }.bind(this);
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

    // don't allow the points to be shown too low
    var correctedPosition = new PIXI.Point(this.position.x, this.position.y);
    if (correctedPosition.y < 10) {
        correctedPosition.y = 10;
    } else if (correctedPosition.y + this.sprite.height > deerHuhn.backgroundLayers[this.position.layer].height - 10) {
        correctedPosition.y = deerHuhn.backgroundLayers[this.position.layer].height - this.sprite.height - 10;
    }
    this.sprite.position = correctedPosition;

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

/**
 * Mute the sound.
 */
DeerHuhn.SingletonSoundSample.prototype.mute = function () {
    this.howl.mute();
};

/**
 * Mute the sound.
 */
DeerHuhn.SingletonSoundSample.prototype.unmute = function () {
    this.howl.unmute();
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

/*
 * Classical indexOf but comparing using an equals() method.
 */
Array.prototype.indexOfUsingEquals = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].equals(val)) {
            return i;
        }
    }
    return -1;
};

/*
 * Add a "remove by value" to array prototype. It only removes first instance of the value.
 *
 * This implementation need all the array's objects to have an equals() method.
 */
Array.prototype.removeUsingEquals = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].equals(val)) {
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
