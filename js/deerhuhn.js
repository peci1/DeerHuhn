var DeerHuhn = function (canvasContainerId) {    
    // canvas & dimensions
    this.MAX_HEIGHT=960;
    this.GAME_CONTAINER = document.getElementById(canvasContainerId);
    this.rendererWidth = this.GAME_CONTAINER.offsetWidth - 8;
    this.rendererHeight = Math.min(this.GAME_CONTAINER.offsetHeight - 8, this.MAX_HEIGHT);
    this.renderingScale = this.rendererHeight/this.MAX_HEIGHT;

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
    this.stage = new PIXI.Stage(0xAAFFFF, interactive);
    this.renderer = PIXI.autoDetectRenderer(this.rendererWidth, this.rendererHeight);
    this.GAME_CONTAINER.appendChild(this.renderer.view);

    // pausing
    this.isPaused = false;
    this.pauseStartTime = 0;

    // fps
    this.lastAnimationFrameTime = 0;
    this.fps = 0;
    
    // variables filled after the assets are loaded
    this.backgroundLayers = [];
    this.sprites = [];
    
    // window callbacks
    window.onresize = this.resize.bind(this);
    window.onorientationchange = this.resize.bind(this);
    window.onblur = this.blur.bind(this);
    window.onfocus = this.focus.bind(this);
    
    this.renderer.view.addEventListener('mousemove', this.mousemove.bind(this), true);

    // other init
    PIXI.Keys.init();
}

DeerHuhn.prototype = {
    
    scrollBackground: function()
    {
	if (this.scrollingDirection === 0)
	    return;

	this.scrollPercentage = Math.max(0, Math.min(1, 
		    this.scrollPercentage - this.scrollingDirection*this.SCROLL_PERCENTAGE_STEP_PER_SECOND/this.fps));

	for (var i = 0; i < this.backgroundLayers.length; i++) {
	    var layer = this.backgroundLayers[i];
            layer.position.x = this.scrollPercentage * (-layer.width + this.rendererWidth);
	}
    },
    
    animate: function() {
	if (this.isPaused)
	    return;

	this.fps = this.calculateFps(new Date());

        this.processKeys();
    
        this.scrollBackground();
    
        this.renderer.render(this.stage);

        requestAnimFrame(this.animate.bind(this));
    },
    
    calculateFps: function(now) {
	var fps;

	if (this.lastAnimationFrameTime === 0) {
	    this.lastAnimationFrameTime = now;
	    return 60;
	}

	fps = 1000 / (now - this.lastAnimationFrameTime);
	this.lastAnimationFrameTime = now;

	return fps; 
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
	for (var i = 4; i >= 0; i--) {
	    this.backgroundLayers[i] = PIXI.Sprite.fromImage('images/vrstva'+(i+1)+'.png');
            this.backgroundLayers[i].position.x = 0;

	    this.sprites.push(this.backgroundLayers[i]);
	    this.stage.addChild(this.backgroundLayers[i]);
	}

	this.populateAnimals.apply(this);
    
        this.resize();
        requestAnimFrame(this.animate.bind(this));
    },

    populateAnimals: function() {
	for (var i = 0; i < 10; i++) {
	    var animal = PIXI.Sprite.fromImage('images/listicka.png');
	    animal.position.x = i/10.0 * this.rendererWidth;
	    animal.position.y = i/10.0 * this.rendererHeight;

	    var layer = Math.round(Math.random() * 4);

	    this.backgroundLayers[layer].addChild(animal);
	    this.sprites.push(animal);
	}
    },

    initializeImages: function() {
	var assets = ['images/vrstva1.png', 'images/vrstva2.png', 'images/vrstva3.png', 'images/vrstva4.png', 'images/vrstva5.png', 'images/listicka.png'];
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
        for (var i = 0; i < this.sprites.length; i++) {
        	this.sprites[i].scale.x = this.renderingScale;
		this.sprites[i].scale.y = this.renderingScale;
        }
    },

    blur: function() {
	this.isPaused = true;
	this.pauseStartTime = new Date();
    },

    focus: function() {
	this.isPaused = false;
	this.lastAnimationFrameTime = new Date() - this.pauseStartTime;
	this.animate();
    }
}

/*
 * A class specifying position of an object in a layered scene.
 */
DeerHuhn.ScenePosition = function(layer, x, y) {
    this.layer = layer;
    this.x = x;
    this.y = y;
}

/*
 * Represents an animal.
 */
DeerHuhn.Animal = function(animalType) {
    this.type = animalType;
    this.sprite = PIXI.Sprite.fromImage(this.type.imagePath);

    // randPositionIdx == TODO
    this.scenePosition = this.type.startPositions[randPositionIdx];
}

/*
 * Represents a type of animal.
 */
DeerHuhn.AnimalType = function(imagePath, startPositions, paths) {
    this.imagePath = imagePath;
    this.startPositions = startPositions;
    this.paths = paths;
}

var deerHuhn = new DeerHuhn('gameContainer');
deerHuhn.initializeImages();
