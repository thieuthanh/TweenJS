/*
* SmartRotationPlugin
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/
(function (scope) {

	function rgbToHsl(r, g, b) {
		var m = 1 / 255;
		r *= m, g *= m, b *= m;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) * 0.5;

		if (max === min) {
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}
		return [h*360, s*100, l*100];
	}

	function hslToRgb(h, s, l) {
		h /= 360; s /=100; l/=100;
		var r, g, b;
		if (s == 0) {
			r = g = b = l; // achromatic
		} else {
			function hue2rgb(p, q, t) {
				if (t < 0) {
					t += 1;
				}
				if (t > 1) {
					t -= 1;
				}
				if (t < 1 / 6) {
					return p + (q - p) * 6 * t;
				}
				if (t < 0.5) {
					return q;
				}
				if (t < 2 / 3) {
					return p + (q - p) * (2 / 3 - t) * 6;
				}
				return p;
			}

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
		return [r * 255, g * 255, b * 255];
	}

	/**
	 * @module TweenJS
	 */
	/**
	 * The ColorPlugin tweens color strings by splitting channels, and tweening channels individually. It supports most
	 * color formats that CSS supports, and is intended to tween both basic EaselJS Graphics color values, as well as
	 * a generic "color" property. Additional values may be added.
	 * @class ColorPlugin
	 * @constructor
	 */
	function ColorPlugin() {}
	var s = ColorPlugin;

	/**
	 * The RegExp pattern that matches hsl color strings, with groups for each value.
	 * Note there is no hsla support
	 * @property HSL_COLOR
	 * @type {RegExp}
	 * @static
	 * @protected
	 */
	s.HSL_COLOR = /^hsl\(([0-9.]+), ?([0-9.]+)%?, ?([0-9.]+)%?\)$/i;
	/**
	 * The RegExp pattern that matches rgb color strings, with groups for each value.
	 * Note there is no rgba support
	 * @property RGB_COLOR
	 * @type {RegExp}
	 * @static
	 * @protected
	 */
	s.RGB_COLOR = /^rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)$/i;
	/**
	 * The RegExp pattern that matches a 6-digit RGB string with a preceding #.
	 * Note there is no rgba support
	 * @property FULL_HEX
	 * @type {RegExp}
	 * @static
	 * @protected
	 */
	s.FULL_HEX = /^#([a-f0-9]{6,8})$/i;
	/**
	 * The RegExp pattern that matches a 3-digit RGB string with a preceding #.
	 * @property SHORT_HEX
	 * @type {RegExp}
	 * @static
	 * @protected
	 */
	s.SHORT_HEX = /^#?([a-f0-9]{3})$/i;

	/**
	 * The color tween mode. Supported values are "rgb" and "hsl". RGB tweens are more natural, whereas HSL tweens
	 * will cross over the hue spectrum.
	 * @property mode
	 * @type {string}
	 * @static
	 * @default rgb
	 */
	s.mode = "rgb";

	/**
	 * Install the plugin into TweenJS. The ColorPlugin supports both "style", which works with fill and stroke commands
	 * in EaselJS Graphics, and a generic "color" property, which will work for things like text.
	 * @method install
	 * @static
	 */
	s.install = function () {
		createjs.Tween.installPlugin(s, ["style", "color"]);
	};
	/**
	 * Initialize a new tween. This will normalize a color to the color {{#crossLink "ColorPlugin/mode:property"}}{{/crossLink}}
	 * this tween uses ("rgb" or "hex"). Note that the plugin will always convert new colors to the existing mode.
	 * @method init
	 * @param tween {Tween} The tween instance
	 * @param prop {String} The property name that is tweening
	 * @param value {String} The color string this tween uses
	 * @returns {String} A modified color that this tween uses. If the color can not be read, it will be left alone.
	 * @static
	 */
	s.init = function (tween, prop, value) {
		var color;
		if (value == null) {
			return value;
		} else if (s.mode == "rgb") {
			color = s.convertToRGB(value);
		} else if (s.mode == "hsl") {
			color = s.convertToHSL(value);
		} else {
			return value;
		}
		return color;
	};

	/**
	 * Convert the color string to HSL. This supports most CSS color values, such as `hsl(h,s,l)`, `rgb(r,g,b)`, `#f00`,
	 * and `#ff0000`. Currently colors with alpha channel are not supported.
	 * @method convertToHSL
	 * @param {String} value The color to convert.
	 * @returns {String} An hsl color string
	 * @static
	 */
	s.convertToHSL = function (value) {
		var hsl, color, match = value.match(s.HSL_COLOR);
		if (match != null) {
			return value;
		} else if (match = value.match(s.RGB_COLOR)) {
			hsl = rgbToHsl(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
		} else if (match = value.match(s.FULL_HEX)) {
			color = parseInt(match[1], 16);
			hsl = rgbToHsl(color >> 16, color >> 8 & 0xFF, color & 0xFF);
		} else if (match = value.match(s.SHORT_HEX)) {
			color = match[1];
			var r = color.substr(1, 1),
				g = color.substr(2, 1),
				b = color.substr(3, 1);
			hsl = rgbToHsl(parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16));
		} else {
			console.warn("Couldn't read color", value);
		}
		return "hsl(" + (hsl[0]+0.5|0) + "," + (hsl[1]+0.5|0) + "%," + (hsl[2]+0.5|0) + "%)";
	};

	/**
	 * Convert the color string to RGB. This supports most CSS color values, such as `hsl(h,s,l)`, `rgb(r,g,b)`, `#f00`,
	 * and `#ff0000`. Currently colors with alpha channel are not supported.
	 * @method convertToRGB
	 * @param {String} value The color to convert.
	 * @returns {String} An rgb color string
	 * @static
	 */
	s.convertToRGB = function (value) {
		var rgb, color, match = value.match(s.RGB_COLOR);
		if (match != null) {
			return value;
		} else if (match = value.match(s.HSL_COLOR)) {
			rgb = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
		} else if (match = value.match(s.FULL_HEX)) {
			color = parseInt(match[1], 16);
			rgb = [color >> 16, color >> 8 & 0xFF, color & 0xFF];
		} else if (match = value.match(s.SHORT_HEX)) {
			color = match[1];
			var r = color.substr(1, 1),
					g = color.substr(2, 1),
					b = color.substr(3, 1);
			rgb = [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
		} else {
			console.warn("Couldn't read color", value);
		}
		return "rgb(" + (rgb[0]+0.5|0) + "," + (rgb[1]+0.5|0) + "," + (rgb[2]+0.5|0) + ")";
	};

	/**
	 * Tween the color value. This is called each tween tick. The ColorPlugin will split the color into rgb or hsl
	 * channels (depending on the {{#crossLink "ColorPlugin/mode:property"}}{{/crossLink}} property, and then LERP using
	 * the provided ratio.
	 *
	 * <h4>Calculation</h4>
	 *
	 * 		var newChannelValue = (end - start) * ratio + start;
	 *
	 * @method tween
	 * @param tween {Tween} The tween instance
	 * @param prop {String} The property name
	 * @param value {String} The current color. This is not used.
	 * @param startValues {String} The value this tween starts with, used in the LERP calculation
	 * @param endValues {String} The value this tween ends with, used in the LERP calculation
	 * @param ratio {Number} A value between 0 and 1 that represents where the tween currently is. Used in the LERP
	 * calculation.
	 * @returns {Object} A tweened color string.
	 * @static
	 */
	s.tween = function (tween, prop, value, startValues, endValues, ratio, wait, end) {
		var start = s.getColor(startValues[prop]);
		if (start == null) { return createjs.Tween.IGNORE; }
		var end = s.getColor(endValues[prop]);
		if (end == null) { return createjs.Tween.IGNORE; }

		var a = (end[0] - start[0]) * ratio + start[0] + 0.5 | 0
			b = (end[1] - start[1]) * ratio + start[1] + 0.5 | 0,
			c = (end[2] - start[2]) * ratio + start[2] + 0.5 | 0;

		if (s.mode == "rgb") {
			color = "rgb(" + a + "," + b + "," + c + ")";
		} else if (s.mode == "hsl") {
			color = "hsl(" + a + "," + b + "%," + c + "%)";
		}
		return color;
	};

	/**
	 * Get a color object (containing r,g,b or h,s,l values) from a color string. The color will be converted to the
	 * target {{#crossLink "ColorPlugin/mode:property"}}{{/crossLink}} first.
	 * @method getColor
	 * @param value {String} The color to convert.
	 * @returns {Array} An array containing the channels `[r,g,b]` or `[h,s,l]`.
	 * @static
	 */
	s.getColor = function (value) {
		if (s.mode == "rgb") {
			var color = s.convertToRGB(value);
			var match = color.match(s.RGB_COLOR); // returns pieces
		} else if (s.mode == "hsl") {
			var color = s.convertToHSL(value);
			var match = color.match(s.HSL_COLOR);
		}
		return match.slice(1).map(parseFloat);
	};

	scope.ColorPlugin = ColorPlugin;

})(createjs);