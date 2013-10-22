
// general editor helpers and constants

saffron.editor = function(){
	"use strict";

	var F = saffron.functional;

	var self = {};

	var lx = { w:700, l:160, r:20 };

	self.concept_vs_level = {
		stage: { w:lx.w, h:240 },
		margin: { t:30, b:50, l:lx.l, r:lx.r }
	};

	self.count_vs_level = {
		stage: { w:lx.w, h:150 },
		margin: { t:30, b:50, l:lx.l, r:lx.r }
	};

	self.concept_vs_concept = {
		stage: { w: 250, h: 250 },
		margin: { t: 30, b:150, l:150, r:50 }
	};

	// sets svg settings and creates a stage group underneath it on the given svg.
	// info should be a constant object with stage, margin, etc. members, e.g., self.concept_vs_level.
	self.create_stage = function(svg_elem, info) {
		return d3.select(svg_elem)
				.attr("width", info.stage.w + info.margin.l + info.margin.r)
				.attr("height", info.stage.h + info.margin.t + info.margin.b)
				// stop the browser from letting people drag and drop the svg
				.on("mousedown", function() { d3.event.preventDefault(); })
			.append("g")
				.attr("transform", F.translate(info.margin.l, info.margin.t))
				.attr("stage_width", info.stage.w)
				.attr("stage_height", info.stage.h);
	};

	return self;

}();

