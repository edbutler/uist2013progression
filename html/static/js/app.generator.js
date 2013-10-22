
var saffronapp = angular.module('saffron.app', ['ui.bootstrap']);

saffronapp.controller('ProgressionCtrl', function($scope, $http) {

	$scope.fetch_cset = function() {
		return $http({method: 'GET', url: '/ctrl/{0}/default/conceptset'.format(saffron_gname)})
			.success(function(data) {	
				$scope.concepts = saffron.model.concept_set(data);
				$scope.used_concepts = {};
				$.each($scope.concepts.concepts(), function(i,d) {
					$scope.used_concepts[d.id] = false;
				});
				$scope.progression = saffron.model.progression($scope.concepts, {progression:[{concepts:{}}]});
			});
	}

	// immediately fetch the progression
	$scope.fetch_cset();

	////////////////////////////////////////////////////////////////////////////
	// GAME VIEWER
	////////////////////////////////////////////////////////////////////////////

	$scope.generate_level = function() {
		$.each($scope.concepts.concepts(), function(i,d) {
			$scope.progression.set_concept_for_level(0, d.id, $scope.used_concepts[d.id]);
		});

		// if there is already a level, then this is locked, so don't do anything
		var gendata = {
			progression: $scope.progression.jsonify(),
			index: 0
		};
		$http({method: 'POST', url: '/ctrl/{0}/generate/level'.format(saffron_gname), data: gendata})
			.success(function (level) {	
				$scope.level = level;
				display_level();
			});
	}

	function display_level() {
		$scope.app.set_parent_node($('#game_viewer_content')[0]);
		$scope.app.visualize($scope.level);
	};

	$scope.app = saffron_app;
});

