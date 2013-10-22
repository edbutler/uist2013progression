
saffron.model = function(){
	"use strict";

	var F = saffron.functional;

	// a set of concepts, their names and ids
	function concept_set(cset_data) {
		var cset = cset_data.concepts;

		var self = {};
		self.concepts = function() { return cset; }
		self.ids = function() { return $.map(cset, function(d) { return d.id; }); }
		self.from_id = function(cid) {
			return $.grep(cset, function(c) { return c.id == cid; })[0];
		}
		self.size = function() { return cset.length; }
		return self;
	}

	// a list of levels, their names and ids
	function level_list(num_levels) {
		var _ids = F.range(num_levels);
		var _levels = $.map(_ids, function(d,i) { return { name:(i + 1).toString, id:i }; });

		var self = {};
		self.levels = function() { return _levels; }
		self.ids = function() { return _ids; }
		return self;
	}

	// a 2D concept by concept grid, used for e.g., prereqs, coreqs
	function concept_grid(obj, key) {
		var self = {};

		self.elements = function() { return obj[key]; }

		self.contains = function(post, pre) {
			var arr = $.grep(obj[key], function(d) { return d.pre == pre && d.post == post; });
			if (arr.length > 1) alert("assert fail! too many in list!");
			return arr.length > 0;
		};

		self.is_chain = function(post, pre) {
			if (post == pre) return false;
			var to_explore = {};
			to_explore[post] = true;
			var explored = {};

			while (!(F.is_empty(to_explore))) {
				var next = {};
				for (var cid in to_explore) {
					if (cid in explored) continue;
					if (cid == pre) return true;
					$.each(self.of(cid), function(i,d) { next[d] = true; });
					explored[cid] = true;
				}
				to_explore = next;
			}
			return false;
		}

		// given concept is post, returns a list of concept ids that are prerequesites of post
		self.of = function(post) {
			return $.map($.grep(obj[key], function(d) {
				return d.post == post;
			}), function(d) {
				return d.pre;
			});
		}
		self.add = function(post, pre) {
			if (!self.contains(post, pre)) {
				obj[key].push({post:post, pre:pre});
			}
		};
		self.remove = function(post, pre) {
			obj[key] = $.grep(obj[key], function(d) { return d.pre != pre || d.post != post; });
		};
		return self;
	}

	// a 1D spline (list of control points), used for constraints like intensity
	function spline(obj, key) {
		var self = {};

		self.control_points = function() { return obj[key]; }

		self.add_cp = function(lid, value) {
			var arr = obj[key].slice();
			arr.push([lid, value]);
			arr.sort(function(a,b) {
				return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
			});
			obj[key] = arr;
		}

		self.remove_cp = function(index) {
			obj[key] = $.grep(obj[key], function(d,i) { return i != index; });
		}
		return self;
	}

	// the data for a particular intensity curve, usually one for each type (e.g., spatial vs math)
	function intensity_curve(concept_types, typeobj) {
		var _spline = spline(typeobj, "curve");

		var self = {};
		// the intensity values for each level of the current progression plan
		self.counts = function(progression) {
			return $.map(progression.llist().ids(), function(lid) {
				var csol = progression.concept_set_of_level(lid);
				// filter for concepts that match the type
				var filtered = $.grep(Object.keys(csol), function(k) { return concept_types[k].type === typeobj.id; });
				return { level:lid, count:filtered.length };
			});
		}
		// the spline used to control the constraint (desired intensity levels)
		self.spline = function() { return _spline; }
		return self;
	}

	function intensity(cset, data) {
		var _curves = {};
		$.each(data.types, function(i,typ) {
			var key = typ.id;
			_curves[key] = intensity_curve(data.cdata, typ);
		});

		var self = {};
		self.types = function() { return data.types; }
		self.curves = function() { return _curves; }

		return self;
	}

	// the set of progression constraints
	function constraints(cset, pcon_data) {
		var pcon = pcon_data.constraints;

		var prereqs = concept_grid(pcon, 'prerequisites');
		var coreqs = concept_grid(pcon, 'corequisites');
		var ointen = spline(pcon, 'old_intensity');
		var nrate = spline(pcon, 'newrate');
		var inten = intensity(cset, pcon.intensity);

		var self = {};
		self.general = function() { return pcon.general; }
		self.prerequisites = function() { return prereqs; }
		self.corequisites = function() { return coreqs; }
		self.intensity = function() { return inten; }
		self.ointensity = function() { return ointen; }
		self.newrate = function() { return nrate; }
		self.introduction = function() { return pcon.introduction; }
		self.locked = function() { return pcon.locked; }
		self.jsonify = function() { return pcon; }
		return self;
	}

	// a progression, mapping from concept id to values
	function progression(_cset, prog_data) {
		var prog = prog_data.progression;
		var _llist = level_list(prog.length);
		// a hack to let angular listen for updates without expensive calculation
		// this object is recreated every time the progression changes.
		var updateobj = new Object();

		var self = {};
		self.cset = function() { return _cset; }
		self.llist = function() { return _llist; }

		self.concept_set_of_level = function(lid) {
			return prog[lid].concepts;
		}

		self.cummulative_concepts = function() {
			var cmap = {};
			return $.map(_llist.ids(), function(lid) {
				for (var c in self.concept_set_of_level(lid)) {
					cmap[c] = true;
				}
				return { level:lid, count:F.object_size(cmap) };
			});
		};

		self.is_concept_in_level = function(lid, cid) {
			var concept_set = prog[lid].concepts;
			return cid in concept_set;
		}

		// if value is falsy, removes the concept
		self.set_concept_for_level = function(lid, cid, value) {
			var concept_set = prog[lid].concepts;
			if (value) {
				concept_set[cid] = true;
			} else {
				delete concept_set[cid];
			}
			updateobj = new Object();
		}

		self.set_concepts_for_level = function(lid, array) {
			var concept_set = prog[lid].concepts;
			$.each(array, function(cid, value) {
				if (value) {
					concept_set[cid] = true;
				} else {
					delete concept_set[cid];
				}
			});
			updateobj = new Object();
		}

		// Given concept ids post, pre, returns a bool indicating
		// whether post does not occur until a later level than pre.
		self.does_respect_prereq = function(post, pre) {
			for (var i = 0; i < prog.length; i++) {
				var c = prog[i].concepts;
				// found a post before pre (even if same level)? failure.
				if (post in c) return false;
				// found a pre before post? then we're good.
				if (pre in c) return true;
			}
			// if neither ever showed up, we're still good.
			return true;
		}

		// Given concept ids post, pre, returns a bool indicating
		// whether pre always occurs on a level if post occurs.
		self.does_respect_coreq = function(post, pre) {
			for (var i = 0; i < prog.length; i++) {
				var c = prog[i].concepts;
				if (post in c && !(pre in c)) return false;
			}
			return true;
		}

		// returns the appropriate json object to send to the server
		self.jsonify = function() {
			// don't wrap in "progression," the app will do that
			return prog;
		}

		self.update_obj = function() { return updateobj; }

		return self;
	}

	return {
		concept_set: concept_set,
		level_list: level_list,
		constraints: constraints,
		progression: progression
	};
}();

