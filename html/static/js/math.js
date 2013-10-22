
// general math functionality, like cubic splines

saffron.math = function(){
	"use strict";

	var F = saffron.functional;

	var self = {};

	// is the the tension control, typically .5
	function catmulrom_matrix(s) {
		s = s == undefined ? 0.5 : s;
		return $M([
			[ -s, 2-s,   s-2,  s],
			[2*s, s-3, 3-2*s, -s],
			[ -s,   0,     s,  0],
			[  0,   1,     0,  0]
		]);
	}

	// matrix: a $M spline matrix
	// c: the control points, as a plain JS array
	function spline_coeffs(matrix, c) {
		return matrix.multiply($V(c)).elements;
	}

	// control is an array of control points
	// returns an control.length - 1 length array of 4D vectors
	// representing cubic coeffs of spline segments.
	// this will halucinate the first and last control points so
	// the segments interpolate all the given points.
	self.create_spline = function(control) {	
		var coeffs = [];
		var mat = catmulrom_matrix();
		// remap control to just the y values
		var control_y = $.map(control, function(d) { return d[1]; })
		control_y.unshift(control_y[0]);
		control_y.push(control_y[control_y.length-1]);

		for (var i = 0; i <= control_y.length - 4; i++) {
			coeffs.push({xs:control[i][0], xe:control[i+1][0], y:spline_coeffs(mat, control_y.slice(i,i+4))});
		}

		return coeffs;
	}

	function eval_segment(segment, t) {
		var s = segment;
		return (((s[0] * t + s[1]) * t) + s[2]) * t + s[3];
	}

	self.eval_spline = function(spline, x) {
		if (x < spline[0].xs) return 0;

		for (var i = 0; i < spline.length; i++) {
			var seg = spline[i];
			if (x > seg.xe) continue;
			// otherwise we can assume this is the correct segment
			// compute correct t for this segment
			var t = (x - seg.xs) / (seg.xe - seg.xs);
			return eval_segment(seg.y, t);
		}
		// if it's not in the range, just return nothing
		return 0;
	}

	return self;

}();

