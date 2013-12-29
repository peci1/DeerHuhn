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
    // All animals currently living in the game. Initialized in DeerHuhn.initAnimals().
    this.animals = [];

    // factory for animals
    this.animalFactory = new DeerHuhn.Animals.AnimalFactory();

    // window callbacks
    window.onresize = this.resize.bind(this);
    window.onorientationchange = this.resize.bind(this);
    window.onblur = this.blur.bind(this);
    window.onfocus = this.focus.bind(this);

    this.renderer.view.addEventListener('mousemove', this.mousemove.bind(this), true);

    // other init
    PIXI.Keys.init();
};

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
        var animalClick = function (mouse) {
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
            this.backgroundLayers[i].click = animalClick;

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

                    if (DeerHuhn.Animals.animationTexturesCache[frameBaseName] === undefined)
                        DeerHuhn.Animals.animationTexturesCache[frameBaseName] = [];

                    DeerHuhn.Animals.animationTexturesCache[frameBaseName][positionInAnimation] = PIXI.TextureCache[textureId];
                }
            }
        }

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

    initAnimals: function() {
        for (var i = 0; i < 10; i++) {
            this.addRandomAnimal();
        }
    },

    addRandomAnimal: function() {
        var deerHuhn = this;
        var movementFinishedCallback = function() {
            deerHuhn.removeAnimal(animal);
        };

        var animal = this.animalFactory.createRandomAnimal(movementFinishedCallback);
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
 * @this DeerHuhn.ShootableObject
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

    // we can click through transparent areas of objects
    var useWebGL = (this.renderer instanceof PIXI.WebGLRenderer);
    this.sprite.hitArea = PIXI.TransparencyHitArea.create(this.sprite, useWebGL);

    this.sprite.setInteractive(true);

    // click means shot
    var onClick = function (interactionData) {
        this.onShotCallback.call(this);
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
    this.onShotCallback();
};

/**
 * Get the score for shooting the object in the given game time.
 *
 * @abstract
 * @param {int} gameTime The game time to get score in.
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

// CLASS DeerHuhn.MovingAnimatedObject

/**
 * The callback to call when the object arrives at its target.
 *
 * @callback movementFinishedCallback
 * @this DeerHuhn.MovingAnimatedObject
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
    if (this.movementPercentComplete > 1) {
        this.movementPercentComplete = 1;
        if (this.movementFinishedCallback !== undefined)
        this.movementFinishedCallback();
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
DeerHuhn.Animal = function(name, sprite, animationSpeed, sceneSpeed, scenePath, movementFinishedCallback) {
    DeerHuhn.MovingAnimatedObject.call(this, sprite, null, animationSpeed, sceneSpeed, scenePath, movementFinishedCallback);

    this.name = name;

    var onShotCallback = function() {
        console.log(this.name + ' killed');
        this.movementFinishedCallback.call(this);
    }; 
    this.onShotCallback = onShotCallback.bind(this);

    this.sprite.position.x = -1000;
    this.sprite.position.y = -1000;
};
DeerHuhn.Animal.prototype = Object.create(DeerHuhn.MovingAnimatedObject.prototype);
DeerHuhn.Animal.prototype.constructor = DeerHuhn.Animal;

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
 * Choose a random path from the given set.
 *
 * @param {...DeerHuhn.ScenePath[]} paths All possible paths to choose from.
 * @return {DeerHuhn.ScenePath} A random path from the given lists (might have reversed direction).
 */
DeerHuhn.Animals.AnimalFactory.prototype.getRandomPath = function(paths) {
    var pathArrays = arguments;
    var numPaths = 0;
    for (var i = 0; i < arguments.length; i++)
        numPaths += pathArrays[i].length;

    var randPositionIdx = randInt(0, numPaths-1);

    var path = null;
    for (var i = 0; i < pathArrays.length; i++) {
        if (randPositionIdx >= pathArrays[i].length) {
            randPositionIdx -= pathArrays[i].length;
        } else {
            path = pathArrays[i][randPositionIdx];
            break;
        }
    }

    if (path === null) {
        console.log('Error in selecting random path from ' + arguments.length + ' arguments.');
    }

    if (Math.random() > 0.5)
        path = path.reverse.call(path);  

    return path;
};

/**
 * Create a random animal on a random path.
 *
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animal} A random animal on a random path.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createRandomAnimal = function (movementFinishedCallback) {
    var numFactories = DeerHuhn.Animals.AnimalFactory.factories.length;
    var randFactoryIdx = randInt(0, numFactories-1);

    var randFactory = DeerHuhn.Animals.AnimalFactory.factories[randFactoryIdx];
    return randFactory.call(this, movementFinishedCallback);
};

/**
 * The array of registered factories.
 */
DeerHuhn.Animals.AnimalFactory.factories = [];

// animals are defined in js\deerhuhn.animals.js

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
