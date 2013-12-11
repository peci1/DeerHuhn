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
    this.animals = [];
    
    // window callbacks
    window.onresize = this.resize.bind(this);
    window.onorientationchange = this.resize.bind(this);
    window.onblur = this.blur.bind(this);
    window.onfocus = this.focus.bind(this);
    
    /*
     * All types of animals in the game.
     */
    this.animalTypes = {
	'fox': new DeerHuhn.AnimalType('images/listicka.png', [ 
		new DeerHuhn.ScenePath(1, 50,50,200,200),
		new DeerHuhn.ScenePath(2, 150,150,500,500),
	       	], 
		50.0/1000),
    };

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

	var timeDelta = this.calculateTimeDelta(new Date());
	this.fps = this.calculateFps(timeDelta);

        this.processKeys();
    
        this.scrollBackground();

	this.updateAnimalPositions(timeDelta);
    
        this.renderer.render(this.stage);

        requestAnimFrame(this.animate.bind(this));
    },
    
    calculateTimeDelta: function(now) {
	var timeDelta;

	if (this.lastAnimationFrameTime === 0) {
	    this.lastAnimationFrameTime = now;
	    return 0;
	}

	timeDelta = now - this.lastAnimationFrameTime;
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
	for (var i = 4; i >= 0; i--) {
	    this.backgroundLayers[i] = PIXI.Sprite.fromImage('images/vrstva'+(i+1)+'.png');
            this.backgroundLayers[i].position.x = 0;

	    this.addSprite(this.backgroundLayers[i]);
	    this.stage.addChild(this.backgroundLayers[i]);
	}

	this.initAnimals.apply(this);
    
        this.resize();
        requestAnimFrame(this.animate.bind(this));
    },

    addSprite: function(sprite) {
	this.sprites.push(sprite);
	sprite.scale.x = this.renderingScale;
	sprite.scale.y = this.renderingScale;
    },

    removeSprite: function(sprite) {
	this.sprites.remove(sprite);
    },

    initAnimals: function() {
	for (var i = 0; i < 10; i++) {
	    this.addRandomAnimal();
	}
    },

    addRandomAnimal: function() {
	var animalKeys = Object.keys(this.animalTypes);
	var randAnimalType = this.animalTypes[animalKeys[randInt(0, animalKeys.length-1)]];

	var deerHuhn = this;
	var animal = new DeerHuhn.Animal(randAnimalType, function() {
	    deerHuhn.removeAnimal(animal);
	});
	this.addAnimal(animal);
    },

    addAnimal: function(animal) {
	this.backgroundLayers[animal.scenePosition.layer].addChild(animal.sprite);
	this.addSprite(animal.sprite);
	this.animals.push(animal);
    },

    removeAnimal: function(animal) {
	this.backgroundLayers[animal.scenePosition.layer].removeChild(animal.sprite);
	this.removeSprite(animal.sprite);
	this.animals.remove(animal);
    },

    updateAnimalPositions: function(timeDelta) {
	for (var i = 0; i < this.animals.length; i++) {
	    var animal = this.animals[i];
	    animal.updatePosition(timeDelta);
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

// CLASS DeerHuhn.ScenePath

/*
 * A path in the scene (in a single layer).
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
};

// CLASS DeerHuhn.Animal

/*
 * Represents an animal.
 */
DeerHuhn.Animal = function(animalType, movementFinishedCallback) {
    this.type = animalType;
    this.sprite = PIXI.Sprite.fromImage(this.type.imagePath);
    this.movementPercentComplete = 0.0;
    this.speed = this.type.speed;
    this.movementFinishedCallback = movementFinishedCallback;

    var numPaths = this.type.paths.length;
    var randPositionIdx = randInt(0, numPaths-1);

    this.path = this.type.paths[randPositionIdx];
    this.scenePosition = this.path.startPosition;
    this.sprite.position.x = -1000;
    this.sprite.position.y = -1000;
};

DeerHuhn.Animal.prototype = {
    /*
     * Update the sprite and scene position.
     *
     * @param int timeDelta The number of miliseconds from the last position update.
     */
    updatePosition: function(timeDelta) {
	this.movementPercentComplete += timeDelta * this.speed / this.path.length;
	if (this.movementPercentComplete > 1) {
	    this.movementPercentComplete = 1;
	    if (this.movementFinishedCallback !== undefined)
		this.movementFinishedCallback();
	}

	this.scenePosition = this.path.interpolatePosition(this.movementPercentComplete);

	this.sprite.position.x = this.scenePosition.x;
	this.sprite.position.y = this.scenePosition.y;
    },
};

// CLASS DeerHuhn.AnimalType

/*
 * Represents a type of animal.
 *
 * @param float speed Speed of the animal in px/ms.
 */
DeerHuhn.AnimalType = function(imagePath, paths, speed) {
    this.imagePath = imagePath;
    this.paths = paths;
    this.speed = speed;
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
}

function randInt(min, max) {
    var result = Math.floor((Math.random() * ((max*1.0 + 1) - min)) + min);
    if (result == max + 1)
	return min;
    return result;
}

var deerHuhn = new DeerHuhn('gameContainer');
deerHuhn.initializeImages();
