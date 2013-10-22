
var saffron_app_refraction = function(){
	"use strict";

	var self = {};

	var VIZ = 0;
	var EDIT = 1;

	var parent = null;
	var swfobj = null;
	var mode = null;
	var current_level_data = null;

	var toplay = null;

	self.set_parent_node = function(node) {
		swfobj = null;
		parent = node;
		$(parent).empty();
	};

	self.apiready = function(id) {
		swfobj = document.getElementById(id);
		if (current_level_data != null) {
			swfobj.setLevelFromData(current_level_data);
		}
	};

	self.visualize = function(level_data) {
		current_level_data = JSON.stringify(level_data);

		if (swfobj == null || mode != VIZ) {
			swfobj = null;
			mode = VIZ;
			$(parent).empty().append(
				'<embed id="saffron_visualizer" src="/static/app/refraction/visualizer.swf" width="800" height="600" flashvars="apireadyfn=saffron_app_refraction.apiready&id=saffron_visualizer"/>'
			);
		} if (swfobj != null) {
			swfobj.setLevelFromData(current_level_data);
		}
	};

	self.edit_current = function() {
		if (swfobj == null || mode != EDIT) {
			swfobj = null;
			mode = EDIT;
			$(parent).empty().append(
				'<embed id="saffron_visualizer" src="/static/app/refraction/editor.swf" width="800" height="600" flashvars="apireadyfn=saffron_app_refraction.apiready&id=saffron_visualizer"/>'
			);
		} if (swfobj != null) {
			swfobj.setLevelFromData(current_level_data);
		}
	};

	self.save = function() {
		if (swfobj == null) {
			throw "cannot save when editor is not active";
		}
		return JSON.parse(swfobj.getLevelData());
	};
	
	self.player_apiready = function(id) {
		var player_swfobj = document.getElementById(id);
		player_swfobj.setSequence(toplay.levels, toplay.sequence);
	};

	self.launch = function(parent, levels) {
		var levelData = function() {
			var data = {};	
			$.each(levels, function(idx,lvl) {
				data[idx] = lvl;
			});
			return JSON.stringify(data);
		}();
		var sequenceData = JSON.stringify({
			"metadata":{
				"latest_available_stage":2,
				"release_date":"Nov 25"
			},
			"stages":[
				{
					"data":{
						"name":"Starcadia",
						"description":"",
						"theme":"theme1",
						"bgm":"ambience1",
						"animals":["penguin","galeta"]
					},
					"levels":$.map(levels, function(d,i) { return "" + i; })
				}
			]
		});

		toplay = {
			levels: levelData,
			sequence: sequenceData
		};

		$(parent).empty().append(
			'<embed id="saffron_player" src="/static/app/refraction/generated.swf" width="800" height="600" flashvars="apireadyfn=saffron_app_refraction.player_apiready&id=saffron_player"/>'
		);
	};

	return self;

}();

