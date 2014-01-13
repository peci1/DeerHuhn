/**
 * A stage that can be scaled using the scale parameter (unlike PIXI.Stage).
 *
 * @inheritDoc
 */
PIXI.ScalableStage = function (backgroundColor, interactive) {
    PIXI.Stage.call(this, backgroundColor, interactive);
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

    PIXI.Stage.prototype.updateTransform.call(this);
};
