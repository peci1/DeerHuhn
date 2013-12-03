PIXI.Keys = {
	pressedKeys: [],
	pressedModifiers: [],
	modifiers: {ctrl: 'ctrl', alt: 'alt', meta: 'meta', shift: 'shift'},
	// shorthands for some basic key codes
	keyCodes: {left: 37, right: 39, up: 38, down: 40 },
};

PIXI.Keys.init = function() {

	window.onkeydown = function (e) {
		updateModifiers(e);
		if (PIXI.Keys.pressedKeys[e.keyCode] == undefined) {
			PIXI.Keys.pressedKeys[e.keyCode] = 1;
		}
	}

	window.onkeyup = function (e) {
		updateModifiers(e);
		if (PIXI.Keys.pressedKeys[e.keyCode] != undefined) {
			PIXI.Keys.pressedKeys[e.keyCode] = undefined;	
		}
	}

	function updateModifiers(e) {
		_this = PIXI.Keys;
		pressedModifiers = [];
		(e.altKey) ? _this.pressedModifiers.push(_this.modifiers.alt) : null;
		(e.ctrlKey) ? _this.pressedModifiers.push(_this.modifiers.ctrl) : null;
		(e.metaKey) ? _this.pressedModifiers.push(_this.modifiers.meta) : null;
		(e.shiftKey) ? _this.pressedModifiers.push(_this.modifiers.shift) : null;
	}

}

/**
 *	Returns true if the given key has been pressed.
 *
 *	@param int keyCode Code of the key.
 */
PIXI.Keys.isKeyPressed = function (keyCode) {
	return PIXI.Keys.pressedKeys[keyCode] != undefined;
}

/**
 *	Returns true if the given modifier key has been pressed.
 *
 *	@param string modifier One of PIXI.Keys.modifiers attributes' values.
 */
PIXI.Keys.isModifierPressed = function (modifier) {
	return PIXI.Keys.pressedModifiers.indexOf(modifier) >= 0;
}
