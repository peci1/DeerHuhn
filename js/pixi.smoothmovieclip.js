/**
 * A SmoothMovieClip is extension of PIXI.MovieClip to play the animation at the same speed regardles of current fps.
 *
 * @class SmoothMovieClip
 * @extends MovieClip
 * @constructor
 * @param textures {Array<Texture>} an array of {Texture} objects that make up the animation
 */
PIXI.SmoothMovieClip = function(textures)
{
	PIXI.MovieClip.call(this, textures);

	// the last time the animation frame has been changed
	this.lastAnimFrameChange = new Date();
}

// constructor
PIXI.SmoothMovieClip.prototype = Object.create( PIXI.MovieClip.prototype );
PIXI.SmoothMovieClip.prototype.constructor = PIXI.SmoothMovieClip;

/*
 * This is a callback after the game got unpaused.
 *
 * @param int pausedTime The time the game has been paused for (in ms).
 */
PIXI.SmoothMovieClip.prototype.unPause = function(pausedTime) {
    this.lastAnimFrameChange = new Date(this.lastAnimFrameChange.getTime() + pausedTime);
}

/*
 * Updates the object transform for rendering
 *
 * @method updateTransform
 * @private
 */
PIXI.SmoothMovieClip.prototype.updateTransform = function()
{
	// here we intentionally bypass PIXI.MovieClip.updateTransform
	PIXI.Sprite.prototype.updateTransform.call(this);
	
	if(!this.playing)return;

	var renderTimeDelta = new Date() - this.lastAnimFrameChange;
	this.lastAnimFrameChange = new Date();

	// we probably forgot to update lastAnimFrameChange somewhere
	if (renderTimeDelta > 2000) return;

	// weird, ignore
	if (renderTimeDelta == 0) return;
	
	// we multiply animationSpeed by the current elapsed time from last render
	this.currentFrame += this.animationSpeed * renderTimeDelta / 1000.0;
	
	var round = (this.currentFrame + 0.5) | 0;
	
	if(this.loop || round < this.textures.length)
	{
		this.setTexture(this.textures[round % this.textures.length]);
	}
	else if(round >= this.textures.length)
	{
		this.gotoAndStop(this.textures.length - 1);
		if(this.onComplete)
		{
			this.onComplete();
		}
	}
}
