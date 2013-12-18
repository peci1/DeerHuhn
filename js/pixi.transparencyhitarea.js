/**
 * @author Martin Pecka
 */

/**
 * A hit area defined by opaque pixels of the texture.
 *
 * Do not directly call the constructor. Call #create() instead.
 *
 * @class TransparencyHitArea
 * @constructor 
 * @param PIXI.Sprite sprite The sprite this hitarea handles
 * @param bool useWebGL If true, handle the computations using WebGL, otherwise use Canvas.
 */
PIXI.TransparencyHitArea = function(sprite)
{
	/**
	 * @property sprite
	 * @type PIXI.Sprite
	 */
	this.sprite = sprite;
}

// constructor
//PIXI.TransparencyHitArea.prototype.constructor = PIXI.TransparencyHitArea;

/**
 * Create a hit area defined by opaque pixels of the texture.
 *
 * @param PIXI.Sprite sprite The sprite this hitarea handles
 * @param bool useWebGL If true, handle the computations using WebGL, otherwise use Canvas.
 */
PIXI.TransparencyHitArea.create = function (sprite, useWebGL) {
    if (useWebGL) {
	return new PIXI.WebGLTransparencyHitArea(sprite);
    } else {
	return new PIXI.CanvasTransparencyHitArea(sprite);
    }
}

/**
 * Checks if the x, and y coords passed to this function are contained within this hit area
 *
 * @method contains
 * @param x {Number} The X coord of the point to test
 * @param y {Number} The Y coord of the point to test
 * @return {Boolean} if the x/y coords are within this hit area
 */
PIXI.TransparencyHitArea.prototype.contains = function(x, y)
{
    // first of all perform a rectangle bounds check
    if(this.sprite.width <= 0 || this.sprite.height <= 0)
        return false;

	var x1 = this.sprite.position.x;
	var w = this.sprite.texture.frame.width;
	if(x >= x1 && x <= x1 + w)
	{
		var y1 = this.sprite.position.y;
		var h = this.sprite.texture.frame.height;
		
		if(y >= y1 && y <= y1 + h)
		{
			var xInTexture = x + this.sprite.texture.frame.x;
			var yInTexture = y + this.sprite.texture.frame.y;
			return !this.isTextureTransparentAt(this.getTexture(), 
				xInTexture, yInTexture);
		}
	}

	return false;
}

/*
 * Return the texture used for the handled sprite.
 */
PIXI.TransparencyHitArea.prototype.getTexture = function() {
    return this.sprite.texture.baseTexture.source;
}

/*
 * Returns true if the given texture is transparent at coordinates x, y.
 *
 * @param Image texture The texture.
 * @param int x The questioned x coord in texture frame.
 * @param int y The questioned y coord in texture frame.
 */
PIXI.TransparencyHitArea.prototype.isTextureTransparentAt = function(texture, x, y) {
    throw new Error('Has to be implemented in subclasses');
}

// CANVAS IMPLEMENTATION

/*
 * A transparency-based hit area using Canvas as the underlying technology.
 */
PIXI.CanvasTransparencyHitArea = function (sprite) {
    PIXI.TransparencyHitArea.call(this, sprite);

    // make sure we have a canvas context of the size of the sprite's texture in cache
    texture = this.getTexture();

    canvasContextCache = PIXI.CanvasTransparencyHitArea.canvasContextCache;
    if (canvasContextCache[texture.width] == undefined)
	canvasContextCache[texture.width] = {};
    if (canvasContextCache[texture.width][texture.height] == undefined) {
	el = document.createElement('canvas');
	el.width = texture.width;
	el.height = texture.height;
	canvasContextCache[texture.width][texture.height] = el.getContext('2d');
    }
}
PIXI.CanvasTransparencyHitArea.prototype = Object.create(PIXI.TransparencyHitArea.prototype);
PIXI.CanvasTransparencyHitArea.constructor = PIXI.CanvasTransparencyHitArea;

// we need to draw the textures to canvases, so we store one canvas for each size of texture
PIXI.CanvasTransparencyHitArea.canvasContextCache = {};

/**
 * Creates a clone of this CanvasTransparencyHitArea
 *
 * @method clone
 * @return {CanvasTransparencyHitArea} a copy of the hit area
 */
PIXI.CanvasTransparencyHitArea.prototype.clone = function()
{
    return new PIXI.CanvasTransparencyHitArea(this.sprite);
}

/*
 * Returns true if the given texture is fully transparent at coordinates x, y.
 *
 * @param Image texture The texture.
 * @param int x The questioned x coord in texture frame.
 * @param int y The questioned y coord in texture frame.
 */
PIXI.CanvasTransparencyHitArea.prototype.isTextureTransparentAt = function(texture, x, y) {
    var texture = this.getTexture();
    var ctx = PIXI.CanvasTransparencyHitArea.canvasContextCache[texture.width][texture.height];

    // TODO we could store one canvas per texture
    ctx.clearRect(0, 0, texture.width, texture.height);
    ctx.drawImage(texture, 0, 0);
    var pixelData = ctx.getImageData(x, y, 1, 1).data;

    return pixelData[3] == 0;
}

// WEBGL IMPLEMENTATION
