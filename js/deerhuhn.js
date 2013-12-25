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
   
    this.possiblePaths = [
	new DeerHuhn.ScenePath(3, 167, 273, 638, 413),
	new DeerHuhn.ScenePath(3, 93, 327, 644, 399),
	new DeerHuhn.ScenePath(3, 91, 304, 895, 637),
	new DeerHuhn.ScenePath(3, -28, 483, 622, 378),
	new DeerHuhn.ScenePath(3, -14, 459, 896, 618),
	new DeerHuhn.ScenePath(3, -40, 514, 484, 622),
	new DeerHuhn.ScenePath(3, -23, 667, 458, 643),
	new DeerHuhn.ScenePath(3, 394, 907, 880, 921),
	new DeerHuhn.ScenePath(3, 415, 951, 1366, 576),
	new DeerHuhn.ScenePath(3, 533, 633, 875, 657),
	new DeerHuhn.ScenePath(3, 556, 639, 1138, 808),
	new DeerHuhn.ScenePath(3, 637, 444, 1766, 772),
	new DeerHuhn.ScenePath(3, 656, 433, 1336, 550),
	new DeerHuhn.ScenePath(3, 914, 639, 1394, 574),
	new DeerHuhn.ScenePath(3, 935, 655, 1931, 667),
	new DeerHuhn.ScenePath(4, 671, 384, 1184, 258),
	new DeerHuhn.ScenePath(4, 656, 370, 1519, 421),
	new DeerHuhn.ScenePath(4, 827, 277, 1154, 264),
	new DeerHuhn.ScenePath(4, 844, 282, 1385, 442),
	new DeerHuhn.ScenePath(4, 788, 439, 1328, 489),
	new DeerHuhn.ScenePath(4, 1189, 271, 1559, 417),
	new DeerHuhn.ScenePath(3, 1106, 822, 1480, 570),
	new DeerHuhn.ScenePath(3, 1141, 795, 1894, 691),
	new DeerHuhn.ScenePath(3, 1450, 441, 1651, 343),
	new DeerHuhn.ScenePath(3, 1657, 339, 1969, 375),
	new DeerHuhn.ScenePath(3, 1537, 514, 1898, 387),
	new DeerHuhn.ScenePath(3, 1525, 534, 2695, 603),
	new DeerHuhn.ScenePath(3, 1579, 544, 1958, 649),
	new DeerHuhn.ScenePath(3, 1982, 649, 2686, 592),
	new DeerHuhn.ScenePath(3, 1894, 208, 2305, 240),
	new DeerHuhn.ScenePath(3, 1907, 226, 2471, 363),
	new DeerHuhn.ScenePath(3, 2003, 370, 2312, 253),
	new DeerHuhn.ScenePath(3, 2339, 262, 2458, 306),
	new DeerHuhn.ScenePath(3, 2006, 390, 2494, 354),
	new DeerHuhn.ScenePath(3, 2075, 388, 3248, 643),
	new DeerHuhn.ScenePath(3, 2011, 406, 2684, 598),
	new DeerHuhn.ScenePath(3, 2281, 712, 2699, 577),
	new DeerHuhn.ScenePath(3, 2281, 712, 3188, 658),
	new DeerHuhn.ScenePath(3, 2281, 712, 2741, 744),
	new DeerHuhn.ScenePath(3, 2498, 354, 3251, 645),
	new DeerHuhn.ScenePath(3, 2699, 577, 3419, 576),
	new DeerHuhn.ScenePath(3, 2699, 595, 3187, 657),
	new DeerHuhn.ScenePath(4, 2734, 418, 3560, 423),
	new DeerHuhn.ScenePath(4, 2833, 463, 3421, 558),
	new DeerHuhn.ScenePath(4, 3013, 531, 3469, 480),
	new DeerHuhn.ScenePath(4, 3283, 264, 3575, 252),
	new DeerHuhn.ScenePath(4, 3295, 286, 3647, 391),
    ];

    // renderer setup
    var interactive = true;
    this.stage = new PIXI.Stage(0xAAFFFF, interactive);
    this.stage.name = 'Stage';
    this.renderer = PIXI.autoDetectRenderer(this.rendererWidth, this.rendererHeight);
    this.GAME_CONTAINER.appendChild(this.renderer.view);

    this.useWebGl = (this.renderer instanceof PIXI.WebGLRenderer);

    // pausing
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.pausableObjects = [];

    // fps
    this.lastAnimationFrameTime = 0;
    this.fps = 0;
    
    // variables filled after the assets are loaded
    this.backgroundLayers = [];
    this.sprites = [];
    // All types of animals in the game. Filled in DeerHuhn.initAnimalTypes().
    this.animalTypes = [];
    // All animals currently living in the game. Initialized in DeerHuhn.initAnimals().
    this.animals = [];
    // keys -> "frame" prefixes, values -> array of PIXI.Texture
    this.animationTexturesCache = [];
    
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
	// init background tiles
	for (var i = 5; i >= 0; i--) {
	    this.backgroundLayers[i] = PIXI.Sprite.fromImage('images/vrstva'+i+'.png');
	    this.backgroundLayers[i].name = 'Background ' + i;
            this.backgroundLayers[i].position.x = 0;
	    // make the background layers clickable through the transparent areas
	    this.backgroundLayers[i].hitArea = PIXI.TransparencyHitArea.create(this.backgroundLayers[i]);
	    // this is needed for the background to stop bubbling of click events
	    this.backgroundLayers[i].setInteractive(true);

	    // TODO development code
	    var layer = this;
	    this.backgroundLayers[i].click = function (mouse) {
		console.log('Clicked layer ' + mouse.target.name);
		return false; // stop event bubbling
	    }

	    this.addSprite(this.backgroundLayers[i]);
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

		    if (this.animationTexturesCache[frameBaseName] === undefined)
			this.animationTexturesCache[frameBaseName] = [];

		    this.animationTexturesCache[frameBaseName][positionInAnimation] = PIXI.TextureCache[textureId];
		}
	    }
	}

	this.initActiveObjects.apply(this);
	this.initAnimalTypes.apply(this);

	this.initAnimals.apply(this);
    
        this.resize();
        requestAnimFrame(this.animate.bind(this));
    },

    addSprite: function(sprite) {
	this.sprites.push(sprite);
	sprite.scale.x = this.renderingScale;
	sprite.scale.y = this.renderingScale;

	if ('unPause' in sprite) {
	    this.pausableObjects.push(sprite);
	}
    },

    removeSprite: function(sprite) {
	this.sprites.remove(sprite);

	if ('unPause' in sprite)
	    this.pausableObjects.remove(sprite);
    },

    initActiveObjects: function() {
	//TODO
    },

    initAnimalTypes: function() {
	this.animalTypes['liska'] = new DeerHuhn.AnimalType(this.animationTexturesCache['liska'], 
		'Liška', this.possiblePaths, 50.0/1000, 5);
	this.animalTypes['auto_cervene'] = new DeerHuhn.AnimalType(this.animationTexturesCache['auto_cervene'], 
		'Auto', this.possiblePaths, 100.0/1000, 5);
	this.animalTypes['auto_modre'] = new DeerHuhn.AnimalType(this.animationTexturesCache['auto_modre'], 
		'Auto', this.possiblePaths, 100.0/1000, 5);
	this.animalTypes['kachna_plove'] = new DeerHuhn.AnimalType(this.animationTexturesCache['kachna_plove'], 
		'Kachna', this.possiblePaths, 15.0/1000, 3);
	this.animalTypes['kachna'] = new DeerHuhn.AnimalType(this.animationTexturesCache['kachna'], 
		'Kachna', this.possiblePaths, 70.0/1000, 8);
	this.animalTypes['klady'] = new DeerHuhn.AnimalType(this.animationTexturesCache['klady'], 
		'Klády', this.possiblePaths, 30.0/1000, 5);
	this.animalTypes['lkt'] = new DeerHuhn.AnimalType(this.animationTexturesCache['lkt'], 
		'LKT', this.possiblePaths, 30.0/1000, 5);
	this.animalTypes['odvozka'] = new DeerHuhn.AnimalType(this.animationTexturesCache['odvozka'], 
		'Odvozka', this.possiblePaths, 70.0/1000, 5);
	this.animalTypes['ovce'] = new DeerHuhn.AnimalType(this.animationTexturesCache['ovce'], 
		'Ovce', this.possiblePaths, 5.0/1000, 3);
	this.animalTypes['prase'] = new DeerHuhn.AnimalType(this.animationTexturesCache['prase'], 
		'Prase', this.possiblePaths, 70.0/1000, 5);
	this.animalTypes['sele'] = new DeerHuhn.AnimalType(this.animationTexturesCache['sele'], 
		'Sele', this.possiblePaths, 70.0/1000, 8);
	this.animalTypes['srna'] = new DeerHuhn.AnimalType(this.animationTexturesCache['srna'], 
		'Srna', this.possiblePaths, 60.0/1000, 6);
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
	var assets = ['images/vrstva0.png', 'images/vrstva1.png', 'images/vrstva2.png', 'images/vrstva3.png', 'images/vrstva4.png', 'images/vrstva5.png', 'images/sprites-interactive.json', 'images/sprites-passive.json'];
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

    pause: function() {
	this.isPaused = true;
	this.pauseStartTime = new Date();
    },

    unPause: function() {
	this.isPaused = false;

	var timeDelta = new Date() - this.pauseStartTime;

	for (var obj in this.pausableObjects) {
	    if ('unPause' in this.pausableObjects[obj]) {
		this.pausableObjects[obj].unPause(timeDelta);
	    }
	}

	this.lastAnimationFrameTime = new Date();
	this.animate();
    },

    blur: function() {
	this.pause.call(this);
    },

    focus: function() {
	this.unPause.call(this);
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

// CLASS DeerHuhn.Animal

/*
 * Represents an animal.
 */
DeerHuhn.Animal = function(animalType, movementFinishedCallback) {
    this.type = animalType;

    this.name = animalType.name;
    this.sprite = new PIXI.SmoothMovieClip(this.type.animationTextures);
    // we can click through transparent areas of animals
    this.sprite.hitArea = PIXI.TransparencyHitArea.create(this.sprite);
    this.sprite.setInteractive(true);
    this.sprite.loop = true;
    this.sprite.animationSpeed = this.type.animationSpeed;
    this.sprite.gotoAndPlay(0);

    var animal = this;
    this.sprite.click = function (interactionData) {
	animal.onShot.apply(animal);
	return false; // stop event bubbling
    }

    this.movementPercentComplete = 0.0;
    this.speed = this.type.speed;
    this.movementFinishedCallback = movementFinishedCallback;

    var numPaths = this.type.paths.length;
    var randPositionIdx = randInt(0, numPaths-1);

    this.path = this.type.paths[randPositionIdx];
    if (Math.random() > 0.5)
	this.path = this.path.reverse.call(this.path);

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

	if (this.isMovingLeft() && this.sprite.scale.x > 0) {
	    this.sprite.scale.x = -this.sprite.scale.x;
	} else if (!this.isMovingLeft() && this.sprite.scale.x < 0) {
	    this.sprite.scale.x = -this.sprite.scale.x;
	}
    },

    /*
     * Returns true if the animal is moving left; false means moving right.
     */
    isMovingLeft: function() {
	return this.path.startPosition.x > this.path.endPosition.x;
    },

    /*
     * Callback called when the animal gets shot.
     */
    onShot: function() {
	console.log(this.name + ' killed');
	this.movementFinishedCallback.call(this);
    }
};

// CLASS DeerHuhn.AnimalType

/*
 * Represents a type of animal.
 *
 * @param array of PIXI.Texture animationTextures The textures used for animation.
 * @param float speed Speed of the animal in px/ms.
 * @param float animationSpeed The speed of animation (in desired fps).
 */
DeerHuhn.AnimalType = function(animationTextures, name, paths, speed, animationSpeed) {
    this.animationTextures = animationTextures;
    this.name = name;
    this.paths = paths;
    this.speed = speed;
    this.animationSpeed = animationSpeed;
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
