/**
 * A fox.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Liska = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Liška', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.liska), 
            5, 
            50.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Liska.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Liska.prototype.constructor = DeerHuhn.Animals.Liska;

/**
 * Create a fox on a random path.
 *
 * @constructs {DeerHuhn.Animals.Liska}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Liska} A fox.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createLiska = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Liska(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createLiska);

/**
 * A red car.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.AutoCervene = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Auto', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.auto_cervene), 
            5, 
            100.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.AutoCervene.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.AutoCervene.prototype.constructor = DeerHuhn.Animals.AutoCervene;

/**
 * Create a red car on a random path.
 *
 * @constructs {DeerHuhn.Animals.AutoCervene}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.AutoCervene} A red car.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createAutoCervene = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.AutoCervene(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createAutoCervene);

/**
 * A blue car.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.AutoModre = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Auto', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.auto_modre), 
            5, 
            100.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.AutoModre.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.AutoModre.prototype.constructor = DeerHuhn.Animals.AutoModre;

/**
 * Create a blue car on a random path.
 *
 * @constructs {DeerHuhn.Animals.AutoModre}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.AutoModre} A blue car.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createAutoModre = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.AutoModre(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createAutoModre);

/**
 * A floating duck.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.KachnaPlove = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Kachna', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.kachna_plove), 
            3, 
            15.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.KachnaPlove.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.KachnaPlove.prototype.constructor = DeerHuhn.Animals.KachnaPlove;

/**
 * Create a floating duck on a random path.
 *
 * @constructs {DeerHuhn.Animals.KachnaPlove}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.KachnaPlove} A floating duck.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createKachnaPlove = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.KachnaPlove(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createKachnaPlove);

/**
 * A flying duck.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Kachna = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Kachna', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.kachna), 
            8, 
            70.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Kachna.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Kachna.prototype.constructor = DeerHuhn.Animals.Kachna;

/**
 * Create a flying duck on a random path.
 *
 * @constructs {DeerHuhn.Animals.Kachna}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Kachna} A flying duck.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createKachna = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Kachna(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createKachna);

/**
 * A block of logs.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Klady = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Klády', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.klady), 
            5, 
            30.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Klady.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Klady.prototype.constructor = DeerHuhn.Animals.Klady;

/**
 * Create a block of logs on a random path.
 *
 * @constructs {DeerHuhn.Animals.Klady}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Klady} A block of logs.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createKlady = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Klady(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createKlady);

/**
 * A tractor.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.LKT = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'LKT', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.lkt), 
            5, 
            30.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.LKT.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.LKT.prototype.constructor = DeerHuhn.Animals.LKT;

/**
 * Create a tractor on a random path.
 *
 * @constructs {DeerHuhn.Animals.LKT}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.LKT} A tractor.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createLKT = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.LKT(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createLKT);

/**
 * A collector.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Odvozka = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Odvozka', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.odvozka), 
            5, 
            30.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Odvozka.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Odvozka.prototype.constructor = DeerHuhn.Animals.Odvozka;

/**
 * Create a collector on a random path.
 *
 * @constructs {DeerHuhn.Animals.Odvozka}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Odvozka} A collector.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createOdvozka = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Odvozka(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createOdvozka);

/**
 * A sheep.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Ovce = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Ovce', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.ovce), 
            3, 
            5.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Ovce.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Ovce.prototype.constructor = DeerHuhn.Animals.Ovce;

/**
 * Create a sheep on a random path.
 *
 * @constructs {DeerHuhn.Animals.Ovce}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Ovce} A sheep.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createOvce = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Ovce(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createOvce);

/**
 * A wild boar.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Prase = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Prase', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.prase), 
            5, 
            70.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Prase.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Prase.prototype.constructor = DeerHuhn.Animals.Prase;

/**
 * Create a wild boar on a random path.
 *
 * @constructs {DeerHuhn.Animals.Prase}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Prase} A wild boar.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createPrase = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Prase(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createPrase);

/**
 * A wild boar child.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Sele = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Sele', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.sele), 
            8, 
            70.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Sele.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Sele.prototype.constructor = DeerHuhn.Animals.Sele;

/**
 * Create a wild boar child on a random path.
 *
 * @constructs {DeerHuhn.Animals.Sele}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Sele} A wild boar child.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createSele = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Sele(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createSele);

/**
 * A deer.
 *
 * @constructor
 * @param {DeerHuhn.ScenePath} scenePath The path this object moves along.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 */
DeerHuhn.Animals.Srna = function (scenePath, movementFinishedCallback) {
    DeerHuhn.Animal.call(this, 
            'Srna', 
            new PIXI.SmoothMovieClip(DeerHuhn.Animals.animationTexturesCache.srna), 
            6, 
            60.0/1000, 
            scenePath, 
            movementFinishedCallback);
};
DeerHuhn.Animals.Srna.prototype = Object.create(DeerHuhn.Animal.prototype);
DeerHuhn.Animals.Srna.prototype.constructor = DeerHuhn.Animals.Srna;

/**
 * Create a deer on a random path.
 *
 * @constructs {DeerHuhn.Animals.Srna}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Srna} A deer.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createSrna = function (movementFinishedCallback) {
    var paths = this.possiblePaths;
    var path = this.getRandomPath(paths);
    return new DeerHuhn.Animals.Srna(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createSrna);
