/**
 * @author Martin Pecka
 */

/**
 * A hit area defined by opaque pixels of the texture.
 *
 * @class TransparencyHitArea
 * @constructor 
 * @param PIXI.Sprite sprite The sprite this hitarea handles
 */
PIXI.TransparencyHitArea = function(sprite)
{
	/**
	 * @property sprite
	 * @type PIXI.Sprite
	 */
	this.sprite = sprite;
}

/**
 * Creates a clone of this TransparencyHitArea
 *
 * @method clone
 * @return {TransparencyHitArea} a copy of the hit area
 */
PIXI.TransparencyHitArea.prototype.clone = function()
{
	return new PIXI.TransparencyHitArea(this.sprite);
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
	var w = this.sprite.width / this.sprite.scale.x;
	if(x >= x1 && x <= x1 + w)
	{
		var y1 = this.sprite.position.y;
		var h = this.sprite.height / this.sprite.scale.y;
		
		if(y >= y1 && y <= y1 + h)
		{
			var xInTexture = x-x1;
			var yInTexture = y-y1;
			return !this.isTextureTransparentAt(this.sprite.texture.baseTexture.source, 
				xInTexture, yInTexture);
		}
	}

	return false;
}

/*
 * Returns true if the given texture is transparent at coordinates x, y.
 *
 * @param Image texture The texture.
 * @param int x The questioned x coord in texture frame.
 * @param int y The questioned y coord in texture frame.
 */
PIXI.TransparencyHitArea.prototype.isTextureTransparentAt = function(texture, x, y) {
    return false; //TODO
}

// constructor
PIXI.TransparencyHitArea.prototype.constructor = PIXI.TransparencyHitArea;
