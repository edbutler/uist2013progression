
// functional programming helpers

saffron.functional = function(){
	"use strict";

	// modify all strings to have a format function
	if (!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;
			return this.replace(/{(\d+)}/g, function(match, number) { 
				return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
			});
		};
	}

	// python's range function
	function range(start, stop, step){
		if (typeof stop=='undefined'){
			// one param defined
			stop = start;
			start = 0;
		};
		if (typeof step=='undefined'){
			step = 1;
		};
		if ((step>0 && start>=stop) || (step<0 && start<=stop)){
			return [];
		};
		var result = [];
		for (var i=start; step>0 ? i<stop : i>stop; i+=step){
			result.push(i);
		};
		return result;
	}

	// size of an object
	function object_size(obj) {
		var count = 0;
		for (var key in obj) {
			count++;
		}
		return count;
	}

	function is_empty(obj) {
		for (var key in obj) {
			return false;
		}
		return true;
	}

	// linear interpolation
	function lerp(x, min, max) {
		return x * (max - min) + min;
	}

	// functional composition
	function compose(f,g) {
		return function(x) { return f(g(x)); };
	}

	// returns a function that, given an object, will query for the given key
	function getfn(key) {
		return function(obj) { return obj[key]; };
	}

	function idxfn(d, i) {
		return i;
	}

	// curry f with the given arguments
	// e.g.: apply(f, x, y)(z, w) <=> f(x,y,z,w)
	function apply(f) {
		var args = Array.prototype.slice.call(arguments, 1)
		return function(x) {
			return f.apply(this, args.concat(x))
		}
	}

	// Given funcion f, returns a function (elem, idx) => f(idx)
	function appidx(f) {
		return function(d,i) { return f(i); };
	}

	// equivalent to compose(f, getfn(key))
	function appget(f, key) {
		return function(obj) { return f(obj[key]); };
	}

	function translate(x, y) {
		return "translate({0},{1})".format(x, y);
	}

	function apptranslate(fx, fy) {
		// check if fx/fy are constants, if so, replace them with constant functions
		var cx, cy;
		if (typeof fx === 'number') {
			cx = fx;
			fx = function(d,i) { return cx; }
		}
		if (typeof fy === 'number') {
			cy = fy;
			fy = function(d,i) { return cy; }
		}

		return function(d,i) {
			return "translate({0},{1})".format(fx(d,i), fy(d,i));
		}
	}

	return {
		range : range,
		object_size : object_size,
		is_empty: is_empty,
		lerp : lerp,
		compose : compose,
		getfn : getfn,
		idxfn : idxfn,
		apply : apply,
		appidx : appidx,
		appget : appget,
		translate : translate,
		apptranslate : apptranslate
	};
}();

