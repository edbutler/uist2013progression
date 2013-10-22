
var saffronapp = angular.module('saffron.app', ['ui.bootstrap', 'saffron.editor.progression', 'saffron.editor.constraints']);

saffronapp.controller('ProgressionCtrl', function($scope, $http) {

	// the panes
	$scope.panes = {
		progedit: { title: "Progression Editor", active: true },
		gameedit: { title: "Game Editor", active: false },
		gameplay: { title: "Game Player", active: false }
	};

	////////////////////////////////////////////////////////////////////////////
	// PROGRESSION EDITOR
	////////////////////////////////////////////////////////////////////////////

	// the current progression editor draw tool
	$scope.drawtool_options = [{value:'draw', name:'Draw', verb:'add'}, {value:'erase', name:'Erase', verb:'remove'}];
	$scope.drawtool = $scope.drawtool_options[0];

	$scope.layout = "h";
	$scope.change_layout = function() {
		$scope.layout = $scope.layout == "h" ? "v" : "h";
	}

	$scope.level_lock_button_text = function(lid) {
		if (!$scope.constraints) return "-";
		return lid in $scope.constraints.locked() ? "U" : "L";
	}

	$scope.lids = function() {
		return $scope.cset_and_llist ? $scope.cset_and_llist.llist.ids() : [];
	};

	$scope.grid_col_width = function() {
		if (!$scope.cset_and_llist) return 0;
		return saffron.editor.concept_vs_level.stage.w / $scope.cset_and_llist.llist.ids().length;
	}

	$scope.toggle_lock = function(lid) {
		if (!$scope.constraints) return;
		var lockobj = $scope.constraints.locked();
		if (lid in lockobj) {
			// remove the lock if it exists
			delete lockobj[lid];
		} else if ($scope.progression) {
			// add a lock for the current progression (if we actually have a progression)
			lockobj[lid] = $scope.progression.concept_set_of_level(lid);
		}
	}

	$scope.get_count_error = function() {
		return null;
	}

	// error function for both prereqs and coreqs, the type is the argument
	function get_req_error(reqtype, checkfn, errormsgfmt) {
		return function() {
			if (!$scope.constraints || !$scope.progression) return null;

			var reqs = $scope.constraints[reqtype]().elements();
			var prog = $scope.progression;
			var bad = $.grep(reqs, function(d) { return !prog[checkfn](d.post, d.pre); })
			if (bad.length > 0) {
				return errormsgfmt.format(bad[0].post, bad[0].pre);
			} else {
				return null;
			}
		}
	}

	function get_reqs(reqtype, c) {
		return {
			id: c.id,
			name: c.name,
			reqs: $.map($scope.constraints[reqtype]().of(c.id), function(d) { return $scope.concepts.from_id(d).name; })
		};
	}

	$scope.all_reqs = {}
	
	$scope.$watch('constraints.prerequisites().elements()', function (new_val) {
		if (!$scope.concepts) return;
		$scope.all_reqs.pre = $.map($scope.concepts.concepts(), function(d) { return get_reqs('prerequisites', d); });
	}, true);

	$scope.$watch('constraints.corequisites().elements()', function (new_val) {
		if (!$scope.concepts) return;
		$scope.all_reqs.co = $.map($scope.concepts.concepts(), function(d) { return get_reqs('corequisites', d); });
	}, true);

	$scope.get_prereq_error = get_req_error("prerequisites", "does_respect_prereq", "Concept {0} appears before prereq {1}.");
	$scope.get_coreq_error = get_req_error("corequisites", "does_respect_coreq", "Concept {0} appears without coreq {1}.");

	$scope.fetch_cset = function() {
		return $http({method: 'GET', url: '/ctrl/{0}/default/conceptset'.format(saffron_gname)})
			.success(function(data) {	
				$scope.concepts = saffron.model.concept_set(data);
			});
	}

	$scope.fetch_pcon = function() {
		return $http({method: 'GET', url: '/ctrl/{0}/default/constraints'.format(saffron_gname)})
			.success(function(data) {	
				$scope.constraints = saffron.model.constraints($scope.concepts, data);
				$scope.cset_and_llist = {
					cset: $scope.concepts,
					llist: saffron.model.level_list($scope.constraints.general().num_levels)
				};
			});
	}

	$scope.is_generate_progression_available = true;

	$scope.generate_progression = function() {
		$scope.panes.progedit.active = true;

		// clear old levels
		//$scope.progression = undefined;
		$scope.is_generate_progression_available = false;

		// generate progression
		var gendata = {
			constraints: $scope.constraints.jsonify()
		};
		$http({method: 'POST', url: '/ctrl/{0}/generate/progression'.format(saffron_gname), data: gendata})
			.success(function(data) {	
				$scope.progression = saffron.model.progression($scope.concepts, data);
				$scope.is_generate_progression_available = true;
			});
	};

	// immediately fetch the progression
	$scope.fetch_cset().then($scope.fetch_pcon).then($scope.generate_progression);


	////////////////////////////////////////////////////////////////////////////
	// GAME VIEWER
	////////////////////////////////////////////////////////////////////////////

	$scope.levels = [];

	function generate_level(index,callback) {
		var gendata = {
			progression: $scope.progression.jsonify(),
			index: index
		};
		$http({method: 'POST', url: '/ctrl/{0}/generate/level'.format(saffron_gname), data: gendata})
			.success(function (level) {	
				$scope.levels[index] = level;
				if (index == 0) {
					$scope.display_level(index);
				}
        callback();
			});
	}

  function launch_generation_workers() {
    while($scope.generation_jobs.length > 0 && $scope.pool_slots > 0) {
      var job = $scope.generation_jobs.shift(); 
      $scope.pool_slots--;
      generate_level(job, function() {
        $scope.pool_slots++;
        launch_generation_workers();
      });
    }
  }

	// function that uses the current progression to generate a game
	$scope.generate_game = function() {
		$scope.panes.gameedit.active = true;
		$scope.app.set_parent_node($('#game_viewer_content')[0]);

		// clear old levels, unless they are locked. this will still behave correctly if a non-existent level is locked
		// can't use $.map because it removes null values because those cocks don't know how to write a robust library and I'm too lazy to find a better implementation or write my own
		var old_levels = $scope.levels;
		$scope.levels = [];
		$.each($scope.lids(), function(i,lid) { $scope.levels.push(lid in $scope.constraints.locked() ? old_levels[lid] : undefined); });
		// generate each level, a few in parallel
    $scope.pool_slots = 4;
    $scope.generation_jobs = $scope.progression.llist().ids().slice(0);
		launch_generation_workers();
	};

	$scope.all_levels_generated = function() {
		var l = $scope.levels;
		return $scope.progression && l.length == $scope.progression.llist().ids().length && l[l.length - 1];
	}

	$scope.display_level = function(idx) {
		$scope.curr_view_lid.value = idx;
		$scope.is_editing = false;
		if ($scope.levels && $scope.levels[idx]) {
			$scope.app.visualize($scope.levels[idx]);
		}
	};

	$scope.curr_view_lid = { value: null };
	$scope.is_editing = false;

	$scope.analyze_level = function(idx) {
		var data = {level:JSON.stringify($scope.levels[idx])};
		$http({method: 'POST', url: '/ctrl/{0}/analyze/level'.format(saffron_gname), data: data})
			.success(function (result) {	
				$scope.progression.set_concepts_for_level(idx, result.concepts)
			});
	};

	$scope.edit_level = function() {
		if ($scope.levels && $scope.levels[0]) {
			$scope.app.edit_current();
			$scope.is_editing = true;
		}
	};

	$scope.save_level = function() {
		var data = $scope.app.save();
		if (data) {
			var idx = $scope.curr_view_lid.value;
			$scope.levels[idx] = data;
			$scope.display_level(idx);

			$scope.analyze_level(idx);
		}
	};

	$scope.launch_game = function() {
		$scope.panes.gameplay.active = true;
		$scope.app.launch($('#game_player_content')[0], $scope.levels);
	}

	$scope.app = saffron_app;
});

