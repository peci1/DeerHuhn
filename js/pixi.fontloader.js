/**
 * @author Martin Pecka
 */

/**
 * Loads a web font by its family. The web font has to be loaded by standard CSS3 ways.
 *
 * Utilizes the FontLoader utility from https://github.com/smnh/FontLoader (needs to be loaded!)
 *
 * @class FontLoader
 * @uses EventTarget
 * @constructor
 * @param faceStrings {String[]} The font face strings with ".webfont" extension appended.
 */
PIXI.FontLoader = function(faceStrings)
{
    /*
     * i use texture packer to load the assets..
     * http://www.codeandweb.com/texturepacker
     * make sure to set the format as "JSON"
     */
    PIXI.EventTarget.call(this);

    /**
     * The font face strings with ".webfont" extension appended.
     *
     * @property faceString
     * @type String[]
     */
    this.faceStrings = faceStrings;
};

PIXI.FontLoader.extension = ".webfont";

// constructor
PIXI.FontLoader.prototype.constructor = PIXI.FontLoader;

/**
 * Loads the XML font data
 *
 * @method load
 */
PIXI.FontLoader.prototype.load = function()
{
    var faces = [];
    for (var i=0; i < this.faceStrings.length; i++) {
        faces[i] = this.faceStrings[i].substring(0, this.faceStrings[i].length - PIXI.FontLoader.extension.length);
    }

    var loadingTimeout = 10000;
    var fontLoader = new FontLoader(faces, {
        "fontLoaded": function(fontFamily) {
             //console.log("font loaded: " + fontFamily);
        }.bind(this),
        "fontsLoaded": function(error) {
            if (error !== null) {
                // Reached the timeout but not all fonts were loaded
                 //console.log(error.message);
                 //console.log(error.notLoadedFontFamilies);
            } else {
                //console.log('All fonts loaded');
                this.onLoaded();
            }
        }.bind(this)
    }, loadingTimeout);
    fontLoader.loadFonts();
};

/**
 * Invoked when the font is ready to be used.
 *
 * @method onLoaded
 * @private
 */
PIXI.FontLoader.prototype.onLoaded = function()
{
    this.dispatchEvent({type: "loaded", content: this});
};



/**
 * An asset loader able to load webfonts using PIXI.FontLoader.
 */
PIXI.FontAwareAssetLoader = function(assetURLs, crossorigin) {
    PIXI.AssetLoader.call(this, assetURLs, crossorigin);

    this.loadersByType[PIXI.FontLoader.extension.substring(1)] = PIXI.FontLoader;
};
PIXI.FontAwareAssetLoader.prototype = Object.create(PIXI.AssetLoader.prototype);
PIXI.FontAwareAssetLoader.prototype.constructor = PIXI.FontAwareAssetLoader;

PIXI.FontAwareAssetLoader.prototype.load = function()
{
    var scope = this;

	this.loadCount = this.assetURLs.length;
    var webfonts = [];
    var assetLoadedCb = function() {
        scope.onAssetLoaded();
    };

    for (var i=0; i < this.assetURLs.length; i++)
	{
		var fileName = this.assetURLs[i];
		var fileType = fileName.split(".").pop().toLowerCase();

        if (fileType === PIXI.FontLoader.extension.substring(1)) {
            webfonts.push(fileName);
            this.loadCount--;
            continue;
        }

        var loaderClass = this.loadersByType[fileType];
        if(!loaderClass)
            throw new Error(fileType + " is an unsupported file type");

        var loader = new loaderClass(fileName, this.crossorigin);

        loader.addEventListener("loaded", assetLoadedCb);
        loader.load();
	}

    if (webfonts.length > 0) {
        this.loadCount++;
        var loaderClass = PIXI.FontLoader;
        var loader = new loaderClass(webfonts);

        loader.addEventListener("loaded", assetLoadedCb);

        loader.load();
    }
};
