/**
 * A stage that can be scaled using the scale parameter (unlike PIXI.Stage).
 *
 * @inheritDoc
 */
PIXI.ScalableStage = function (backgroundColor, interactive) {
    PIXI.Stage.call(this, backgroundColor, interactive);

    this.alpha = 1;
};

PIXI.ScalableStage.prototype = Object.create( PIXI.Stage.prototype );
PIXI.ScalableStage.prototype.constructor = PIXI.ScalableStage;

/*
 * @inheritDoc
 *
 * Makes the scale parameter to propagate to the transform.
 */
PIXI.ScalableStage.prototype.updateTransform = function()
{
    this.worldTransform[0] = this.scale.x;
    this.worldTransform[4] = this.scale.y;

    this.worldAlpha = this.alpha;
    this.vcount = PIXI.visibleCount;
	
	for(var i=0,j=this.children.length; i<j; i++)
	{
		this.children[i].updateTransform();	
	}
	
	if(this.dirty)
	{
		this.dirty = false;
		// update interactive!
		this.interactionManager.dirty = true;
	}
	
	
	if(this.interactive)this.interactionManager.update();
};
