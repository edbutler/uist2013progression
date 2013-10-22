
var saffron_editor_constraints = angular.module('saffron.editor.constraints', []);

// The progression editor.
// Expects to be placed on an svg element.
saffron_editor_constraints.directive('conceptGrid', function() {

	var F = saffron.functional;
	var E = saffron.editor;
	var stage = E.concept_vs_concept.stage;

	function link(scope, element, attrs) {
		var svgg = E.create_stage(element[0], E.concept_vs_concept);
		var xlabel = attrs.label;
		var dg = saffron.chart.grid();
		var cset;
		var isAntiSymm = scope.$eval(attrs.antiSymmetric);
		var checkfnname = attrs.checkfn;

		scope.$watch('cset', function(new_val, old_val) {
			if (new_val) {
				cset = new_val;
			}
		});

		function reset(grid) {
			// clear all the old stuff
			svgg.selectAll('*').remove();

			if (!(cset && grid)) {
				return;
			}

			var scl = d3.scale.ordinal()
				.domain(cset.ids())
				.rangeBands([0, stage.w]);

			var ct = saffron.chart.celltype;

			function celltypefn(rd, cd) {
				var post = rd.rowid;
				var pre = cd.columnid;
				if (post == pre) return ct.disabled;
				if (grid.contains(post, pre)) {
					if (scope.progression && !scope.progression[checkfnname](post, pre)) {
						return ct.manual_err;
					} else {
						return ct.manual;
					}
				} else if (grid.is_chain(post, pre)) {
					return ct.automatic;
				} else if (isAntiSymm && grid.is_chain(pre, post)) {
					return ct.disabled;
				} else {
					return ct.open;
				}
			}

			function onclick(e, rd, cd) {
				var post = rd.rowid;
				var pre = cd.columnid;
				if (post == pre) return;
				if (isAntiSymm && grid.is_chain(pre, post)) return;

				// make changes to the model within scope.$apply since this callback is outside ng
				return scope.$apply(function() {
					if (grid.contains(post, pre)) {
						grid.remove(rd.rowid, cd.columnid);
					} else {
						grid.add(rd.rowid, cd.columnid);
					}
				});
			}

			dg.width(stage.w)
				.height(stage.h)
				.xscl(scl)
				.yscl(scl)
				.xlabel(xlabel)
				.ylabel("Concepts")
				.vertxlabel(true)
				.xticks(function(d) { return cset.from_id(d).name; })
				.yticks(function(d) { return cset.from_id(d).name; })
				.celltypefn(celltypefn)
				.onclick(onclick)
				.do_reevaluate_on_click(true);

			// create the data binding

			var data = $.map(cset.ids(), function(post) {
				var items = $.map(cset.ids(), function(pre) {
					return {columnid:pre};
				});
				return {rowid:post, columns:items};
			});

			// invoke the charts

			svgg
				.datum(data)
				.call(dg);
		}

		scope.$watch('data', function(grid, old_val) {
			reset(grid);
		});

		scope.$watch('progression.update_obj()', function(new_val, old_val) {
			reset(scope.data);
		});
	}

	return {
		restrict: 'A',
		priority: 10,
		scope: {
			cset:'=',
			data:'=',
			progression:'='
		},
		link: link
	};
});

saffron_editor_constraints.directive('newConceptRate', function() {

	var F = saffron.functional;
	var E = saffron.editor;
	var stage_info = E.count_vs_level;
	var stage = stage_info.stage;

	function link(scope, element, attrs) {

		var svgg = E.create_stage(element[0], stage_info);
		var bc = null;

		function on_new(prog) {
			var counts = scope.progression.cummulative_concepts();
			svgg.datum(counts).call(bc);
		}

		function onchange(control_point, new_y) {
			scope.$apply(function() {
				control_point[1] = new_y;
			});
		}

		function onadd(lid, val) {
			var mspline = scope.constraints.newrate();
			// if a control point does not exist, one can be added
			if ($.grep(mspline.control_points(), function(d) { return d[0] == lid; }).length == 0) {
				scope.$apply(function() {
					mspline.add_cp(lid, val);
				});
			}
		}

		function onremove(cp_index) {
			// don't ever remove first/last control points
			if (cp_index == 0 || cp_index == scope.constraints.newrate().control_points().length - 1) return;

			scope.$apply(function() {
				scope.constraints.newrate().remove_cp(cp_index);
			});
		}

		scope.$watch('cset_and_llist', function(info, old_val) {
			// clear all the old stuff
			svgg.selectAll('*').remove();

			if (!info) {
				return;
			}

			var xscl = d3.scale.ordinal()
				.domain(info.llist.ids())
				.rangeBands([0, stage.w]);

			var yscl = d3.scale.linear()
				.domain([0, info.cset.size()])
				.range([stage.h, 0]);

			bc = saffron.chart.spline_barchart()
				.xlabel("Stage Number")
				.ylabel("Total Concepts Used")
				.width(stage.w)
				.height(stage.h)
				.xscl(xscl)
				.yscl(yscl)
				.onchange(onchange)
				.onadd(onadd)
				.onremove(onremove);
		});

		scope.$watch('progression.update_obj()', function(new_val, old_val) {
			if (scope.progression != undefined && bc != null) {
				on_new(scope.progression);
			}
		});

		// this is really important since the watch is an ephemeral object, otherwise it infinite loops!
		var do_check_deep = true;

		scope.$watch('constraints.newrate().control_points()', function (new_val) {
			if (new_val != undefined && bc != null) {
				bc.intensity(new_val);
				if (scope.progression) {
					on_new(scope.progression);
				}
			}
		}, do_check_deep);
	}

	return {
		restrict: 'A',
		scope: false,
		link: link
	};
});

