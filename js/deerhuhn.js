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
    this.SCROLL_STEP = 50;
    
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
    this.background = null;
    this.sprites = [];
    
    // window callbacks
    window.onresize = this.resize.bind(this);
    window.onorientationchange = this.resize.bind(this);
    window.onblur = this.blur.bind(this);
    window.onfocus = this.focus.bind(this);

    // other init
    PIXI.Keys.init();
}

DeerHuhn.prototype = {
    
    scrollBackground: function()
    {
        this.background.position.x = Math.max(-this.background.width + this.rendererWidth, Math.min(0, this.background.position.x + this.scrollingDirection*this.SCROLL_STEP));
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
	   this.scrollingDirection = 0;
        }
    },
    
    onLoad: function() {
        this.background = PIXI.Sprite.fromImage('images/vrstva5.png');
        this.background.position.x = 0;
        
        this.sprites.push(this.background);
        this.stage.addChild(this.background);
    
        this.resize();
        requestAnimFrame(this.animate.bind(this));
    },

    initializeImages: function() {
	var assets = ['images/vrstva1.png', 'images/vrstva2.png', 'images/vrstva3.png', 'images/vrstva4.png', 'images/vrstva5.png'];
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

var deerHuhn = new DeerHuhn('gameContainer');
deerHuhn.initializeImages();
