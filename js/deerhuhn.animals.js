DeerHuhn.Animals.AnimalFactory.prototype.roadPaths = [
    new DeerHuhn.ScenePath(3, 93, 327, 644, 399),
    new DeerHuhn.ScenePath(4, 2650, 333, 3705, 333),
    new DeerHuhn.ScenePath(3, 2248, 784, 3106, 525),
];

DeerHuhn.Animals.AnimalFactory.prototype.cropsPaths = [
    new DeerHuhn.ScenePath(3, 656, 433, 1336, 550),
    new DeerHuhn.ScenePath(3, 914, 639, 1394, 574),
    new DeerHuhn.ScenePath(3, 1106, 822, 1480, 570),
    new DeerHuhn.ScenePath(3, 1450, 441, 1651, 343),
    new DeerHuhn.ScenePath(3, 1525, 534, 2695, 603),
    new DeerHuhn.ScenePath(3, 1579, 544, 1958, 649),
];

DeerHuhn.Animals.AnimalFactory.prototype.fieldPaths = [
    new DeerHuhn.ScenePath(4, 671, 384, 1184, 258),
    new DeerHuhn.ScenePath(4, 844, 282, 1385, 442),
    new DeerHuhn.ScenePath(4, 2734, 418, 3560, 423),
    new DeerHuhn.ScenePath(4, 2833, 463, 3421, 558),
];

DeerHuhn.Animals.AnimalFactory.prototype.housePaths = [
    new DeerHuhn.ScenePath(3, 167, 273, 638, 413),
];

DeerHuhn.Animals.AnimalFactory.prototype.barnPaths = [
    new DeerHuhn.ScenePath(3, 2281, 712, 2699, 577),
    new DeerHuhn.ScenePath(3, 2281, 712, 3188, 658),
    new DeerHuhn.ScenePath(3, 2281, 712, 2741, 744),
];

DeerHuhn.Animals.AnimalFactory.prototype.waterPaths = [
    new DeerHuhn.ScenePath(3, 394, 738, 702, 710),
    new DeerHuhn.ScenePath(3, 702, 710, 607, 855),
    new DeerHuhn.ScenePath(3, 607, 855, 313, 832),
];

DeerHuhn.Animals.AnimalFactory.prototype.forrestPaths = [
    new DeerHuhn.ScenePath(3, 91, 304, 895, 637),
    new DeerHuhn.ScenePath(3, -28, 483, 622, 378),
    new DeerHuhn.ScenePath(3, -14, 459, 896, 618),
    new DeerHuhn.ScenePath(3, -40, 514, 484, 622),
    new DeerHuhn.ScenePath(3, -23, 667, 458, 643),
    new DeerHuhn.ScenePath(3, 394, 907, 880, 921),
    new DeerHuhn.ScenePath(3, 415, 951, 1366, 576), //almost road path
    new DeerHuhn.ScenePath(3, 533, 633, 875, 657),
    new DeerHuhn.ScenePath(3, 556, 639, 1138, 808), //near lake
    new DeerHuhn.ScenePath(3, 637, 444, 1766, 772),
    new DeerHuhn.ScenePath(3, 935, 655, 1931, 667),
    new DeerHuhn.ScenePath(4, 656, 370, 1519, 421),
    new DeerHuhn.ScenePath(4, 827, 277, 1154, 264),
    new DeerHuhn.ScenePath(4, 788, 439, 1328, 489),
    new DeerHuhn.ScenePath(4, 1189, 271, 1559, 417),
    new DeerHuhn.ScenePath(3, 1141, 795, 1894, 691),
    new DeerHuhn.ScenePath(3, 1657, 339, 1969, 375),
    new DeerHuhn.ScenePath(3, 1982, 649, 2686, 592),
    new DeerHuhn.ScenePath(3, 1894, 208, 2305, 240),
    new DeerHuhn.ScenePath(3, 1907, 226, 2471, 363),
    new DeerHuhn.ScenePath(3, 2003, 370, 2312, 253),
    new DeerHuhn.ScenePath(3, 2339, 262, 2458, 306), //too short
    new DeerHuhn.ScenePath(3, 2006, 390, 2494, 354),
    new DeerHuhn.ScenePath(3, 2075, 388, 3248, 643),
    new DeerHuhn.ScenePath(3, 2011, 406, 2684, 598),
    new DeerHuhn.ScenePath(3, 2498, 354, 3251, 645),
    new DeerHuhn.ScenePath(3, 2699, 577, 3419, 576),
    new DeerHuhn.ScenePath(3, 2699, 595, 3187, 657),
    new DeerHuhn.ScenePath(4, 3013, 531, 3469, 480),
    new DeerHuhn.ScenePath(4, 3283, 264, 3575, 252),
    new DeerHuhn.ScenePath(4, 3295, 286, 3647, 391),
];

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
    var path = this.getRandomPath(this.forrestPaths, this.barnPaths, this.housePaths);
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
    var path = this.getRandomPath(this.roadPaths);
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
    var path = this.getRandomPath(this.roadPaths);
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
    var path = this.getRandomPath(this.waterPaths);
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
    var possibleLayers = [1, 2, 4, 5];
    var layer = possibleLayers[randInt(0, possibleLayers.length-1)];

    var yLeft = randInt(20, 940);
    var yRight = randInt(20, 940);

    var path = new DeerHuhn.ScenePath(layer, -50, yLeft, 3800, yRight);

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

// do not allow a block of woods to move without the tractor
DeerHuhn.Animals.Klady.prototype.updatePosition = function (timeDelta) {
    if (this.parentAnimal === null)
        return;

    DeerHuhn.MovingAnimatedObject.prototype.updatePosition.call(this, timeDelta);
};

/**
 * Create a block of logs on a random path.
 *
 * @constructs {DeerHuhn.Animals.Klady}
 * @param {DeerHuhn.Animals.LKT} parentLKT The tractor handling this block of woods.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Klady} A block of logs.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createKlady = function (parentLKT, movementFinishedCallback) {
    var path = parentLKT.scenePath;
    var klady = new DeerHuhn.Animals.Klady(path, movementFinishedCallback);
    klady.parentAnimal = parentLKT;
    return klady;
};
// we don't want a block of logs to be constructed automatically
//DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createKlady);

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
    var path = this.getRandomPath(this.forrestPaths);
    return new DeerHuhn.Animals.LKT(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createLKT);

/**
 * Create a tractor handling a block of woods on a random path.
 *
 * @constructs {DeerHuhn.Animals.LKT}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.LKT} A tractor.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createLKTWithKlady = function (movementFinishedCallback) {
    var path = this.getRandomPath(this.forrestPaths);

    var lkt = new DeerHuhn.Animals.LKT(path, movementFinishedCallback);
    var klady = this.createKlady(lkt, movementFinishedCallback);
    lkt.childrenAnimals.push(klady);
    lkt.childrenToSpawn.push(new DeerHuhn.AnimalToSpawn(klady, 2000));

    lkt.name = "LKT s náloží";

    return lkt;
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createLKTWithKlady);

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
    var path = this.getRandomPath(this.roadPaths);
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
    var path = this.getRandomPath(this.forrestPaths, this.fieldPaths, this.barnPaths, this.housePaths);
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
    var path = this.getRandomPath(this.forrestPaths, this.cropsPaths, this.barnPaths, this.fieldPaths);
    return new DeerHuhn.Animals.Prase(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createPrase);

/**
 * Create a wild boar family on a random path.
 *
 * @constructs {DeerHuhn.Animals.Prase}
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target. The callback is also used for the children animals.
 * @return {DeerHuhn.Animals.Prase} A wild boar with family.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createVlacek = function (movementFinishedCallback) {
    var path = this.getRandomPath(this.forrestPaths, this.cropsPaths, this.barnPaths, this.fieldPaths);
    var prase = new DeerHuhn.Animals.Prase(path, movementFinishedCallback);

    var numChildren = randInt(1, 5);
    var childSpawnDelay = 700;

    for (var i=1; i <= numChildren; i++) {
        var sele = this.createSeleForPrase(prase, movementFinishedCallback);
        prase.childrenAnimals.push(sele);
        prase.childrenToSpawn.push(new DeerHuhn.AnimalToSpawn(sele, i*childSpawnDelay));
    }

    return prase;
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createVlacek);

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
    var path = this.getRandomPath(this.forrestPaths, this.cropsPaths, this.barnPaths, this.fieldPaths);
    return new DeerHuhn.Animals.Sele(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createSele);

/**
 * Create a wild boar child on a random path.
 *
 * @constructs {DeerHuhn.Animals.Sele}
 * @param {DeerHuhn.Animals.Prase} The parent of this wild boar child.
 * @param {movementFinishedCallback} movementFinishedCallback The callback to call when the object arrives at its target.
 * @return {DeerHuhn.Animals.Sele} A wild boar child.
 */
DeerHuhn.Animals.AnimalFactory.prototype.createSeleForPrase = function (prase, movementFinishedCallback) {
    var sele = new DeerHuhn.Animals.Sele(prase.scenePath, movementFinishedCallback);
    sele.parentAnimal = prase;
    return sele;
};

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
    var path = this.getRandomPath(this.forrestPaths, this.barnPaths, this.fieldPaths);
    return new DeerHuhn.Animals.Srna(path, movementFinishedCallback);
};
DeerHuhn.Animals.AnimalFactory.factories.push(DeerHuhn.Animals.AnimalFactory.prototype.createSrna);
