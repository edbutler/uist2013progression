
var saffron_editor_progression = angular.module('saffron.editor.progression', []);

// The progression editor.
// Expects to be placed on an svg element.
saffron_editor_progression.directive('progressionEditor', function() {
	var F = saffron.functional;
	var E = saffron.editor;

	var stage_info = E.concept_vs_level;
	var stage = stage_info.stage;
	// hack to avoid updates if this is causing the updates
	var is_drawing = false;

	function link(scope, element, attrs) {
		var svgg = E.create_stage(element[0], stage_info);
		var dg = saffron.chart.make_drawable(saffron.chart.grid());
		var ct = saffron.chart.celltype;

		function isfirst(rd, cd) {
			var idx = 0;
			while (rd.columns[idx].columnid !== cd.columnid && idx < rd.columns.length) {
				if (rd.columns[idx].isactive) { return false; }
				idx++;
			}
			return true;
		}

		function celltype(rd, cd) {
			if (scope.constraints && cd.columnid in scope.constraints.locked()) {
				return cd.isactive ? (isfirst(rd, cd) ? ct.locked_new : ct.locked) : ct.disabled;
			} else {
				return cd.isactive ? (isfirst(rd, cd) ? ct.manual_new : ct.manual) : ct.open;
			}
		}

		function update(prog) {
			// create the data binding

			var data = $.map(prog.cset().ids(), function(cid) {
				var levels = $.map(prog.llist().ids(), function(lid) {
					return {columnid:lid, isactive:prog.is_concept_in_level(lid, cid)};
				});
				return {rowid:cid, columns:levels};
			});

			// invoke the charts

			svgg
				.datum(data)
				.call(dg);
		}

		scope.$watch('constraints.locked()', function(new_val) {
			if (scope.progression) {
				update(scope.progression);
			}
		}, true);

		scope.$watch('progression.update_obj()', function(new_val, old_val) {
			// don't reset if we're doing the drawing
			if (is_drawing) {
				return;
			}

			// clear all the old stuff
			svgg.selectAll('*').remove();

			var prog = scope.progression;
			if (!prog) {
				return;
			}

			// create the scales

			var xscl = d3.scale.ordinal()
				.domain(prog.llist().ids())
				.rangeBands([0, stage.w]);

			var yscl = d3.scale.ordinal()
				.domain(prog.cset().ids())
				.rangeBands([0, stage.h]);

			dg
				.width(stage.w)
				.height(stage.h)
				.xscl(xscl)
				.yscl(yscl)
				.celltypefn(celltype)
				.ylabel("Concepts on Stage")
				.xlabel("Stage Number")
				.yticks(function(d) { return prog.cset().from_id(d).name; })
				.onclick(function(e,rd,cd) {
					// if the cell is locked, do nothing
					if (scope.constraints && cd.columnid in scope.constraints.locked()) return;

					// make changes to the model within scope.$apply since this callback is outside ng
					is_drawing = true;
					var rv = scope.$apply(function() {
						switch (scope.drawtool.value) {
							case 'draw':
								prog.set_concept_for_level(cd.columnid, rd.rowid, true);
								cd.isactive = true;
								break;
							case 'erase':
								prog.set_concept_for_level(cd.columnid, rd.rowid, false);
								cd.isactive = false;
								break;
						}
					});
					is_drawing = false;
					return rv;
				});

			update(prog);
		});
	}

	return {
		restrict: 'A',
		scope: false,
		link: link
	};
});

saffron_editor_progression.directive('levelIntensity', function() {

	var F = saffron.functional;
	var E = saffron.editor;
	var stage_info = E.count_vs_level;
	var stage = stage_info.stage;

	function link(scope, element, attrs) {

		var svgg = E.create_stage(element[0], stage_info);
		var bc = null;

		function on_new_concept_counts(concept_counts) {
			svgg.datum(concept_counts).call(bc);
		}

		function onchange(control_point, new_y) {
			scope.$apply(function() {
				control_point[1] = new_y;
			});
		}

		function onadd(lid, val) {
			var inten = scope.constraints.intensity();
			// if a control point does not exist, one can be added
			if ($.grep(inten.control_points(), function(d) { return d[0] == lid; }).length == 0) {
				scope.$apply(function() {
					inten.add_cp(lid, val);
				});
			}
		}

		function onremove(cp_index) {
			// don't ever remove first/last control points
			if (cp_index == 0 || cp_index == scope.constraints.intensity().control_points().length - 1) return;

			scope.$apply(function() {
				scope.constraints.intensity().remove_cp(cp_index);
			});
		}

		scope.$watch('csetllist', function(info, old_val) {
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
				.ylabel("Concepts per Stage")
				.width(stage.w)
				.height(stage.h)
				.xscl(xscl)
				.yscl(yscl)
				.onchange(onchange)
				.onadd(onadd)
				.onremove(onremove);
		});

		// also need to do it for intensity since the object never changes, only the contents.
		scope.$watch('progression.update_obj()', function(new_val, old_val) {
			if (scope.progression != undefined && bc != null) {
				on_new_concept_counts(scope.curve.counts(scope.progression));
			}
		});

		// this is really important since the watch is an ephemeral object, otherwise it infinite loops!
		var do_check_deep = true;

		scope.$watch('curve.spline().control_points()', function (new_val) {
			if (new_val != undefined && bc != null) {
				bc.intensity(new_val);
				if (scope.progression) {
					on_new_concept_counts(scope.curve.counts(scope.progression));
				}
			}
		}, do_check_deep);
	}

	return {
		restrict: 'A',
		scope: {
			csetllist:'=',
			progression:'=',
			curve:'='
		},
		link: link
	};
});

saffron_editor_progression.directive('errorChecker', function() {

	var template = '<div class="saffron_error_heading">' +	
			'<img src="/static/art/valid.png" ng-show="errorfn() == null">' +
			'<img src="/static/art/error.png" ng-hide="errorfn() == null" tooltip="{{errorfn()}}" tooltip-placement="right" tooltip-animation="true">' +
			'<span>{{ title }}</span>' +
		'</div>';


	return {
		restrict: 'E',
		scope: {
			errorfn: "=",
			title: "@"
		},
		template: template,
		replace: true
	};
});

