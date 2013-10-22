
saffron.chart = function(){
	"use strict";

	var F = saffron.functional;
	var M = saffron.math;

	var cpfx = "saffron_draw_";
	var background_class = cpfx + "background";
	var table_row_class = cpfx + "row";
	var table_editable_class = cpfx + "row_editable";
	var x_axis_class = cpfx + "x_axis";
	var y_axis_class = cpfx + "y_axis";
	var axis_label_class = "saffron_axis_label";
	var barchart_extra_class = cpfx + "barchart_extra";
	var overload_bar_class = "saffron_overload_bar";
	var chart_class = "saffron_chart_group";
	var count_bar_normal_class = "saffron_progression_count_bar";
	var count_bar_error_class = "saffron_progression_count_bar_overload";

	var celltype = {
		// a cell that cannot be used
		disabled: cpfx + "e_disabled",
		// a cell that is not current active but available
		open: cpfx + "e_open",
		// a cell that was manually activated
		manual: cpfx + "e_manual",
		manual_new: cpfx + "e_manual_new",
		manual_err: cpfx + "e_manual_err",
		// a cell that was automatically activated (usually due to other constraints)
		automatic: cpfx + "e_automatic",
		automatic_err: cpfx + "e_automatic_err",
		// a cell that is locked active
		locked: cpfx + "e_locked",
		locked_new: cpfx + "e_locked_new"
	}

	// base chart type that exposes getters/setters for basic properties
	function make_basic_chart(self) {
		// dimensions
		var width,
			height,
		// scales for axes
			xscl,
			yscl,
		// major axis labels
			xlabel,
			ylabel,
		// whether the x label should have vertical text
			vertxlabel = false,
		// axis tick labels
			xticks = function(d) { return d; },
			yticks = function(d) { return d; };

		self.width = function(value) {
			if (!arguments.length) return width;
			width = value;
			return self;
		}

		self.height = function(value) {
			if (!arguments.length) return height;
			height = value;
			return self;
		}

		self.xscl = function(value) {
			if (!arguments.length) return xscl;
			xscl = value;
			return self;
		}

		self.yscl = function(value) {
			if (!arguments.length) return yscl;
			yscl = value;
			return self;
		}

		self.xlabel = function(value) {
			if (!arguments.length) return xlabel;
			xlabel = value;
			return self;
		}

		self.ylabel = function(value) {
			if (!arguments.length) return ylabel;
			ylabel = value;
			return self;
		}

		self.vertxlabel = function(value) {
			if (!arguments.length) return vertxlabel;
			vertxlabel = value;
			return self;
		}

		self.xticks = function(value) {
			if (!arguments.length) return xticks;
			xticks = value;
			return self;
		}

		self.yticks = function(value) {
			if (!arguments.length) return yticks;
			yticks = value;
			return self;
		}
	}

	// adds axis labels and classed svg groups to a basic chart
	function add_axes(self, enter) {
		var x_axis = enter.append("g")
			.attr("class", x_axis_class)
			.attr("transform", F.translate(0,self.height()));

		enter.append("g")
			.attr("class", y_axis_class);

		enter.append("text")
			.attr("x", 0)
			.attr("y", -15)
			.attr("text-anchor", "end")
			.attr("class", axis_label_class)
			.text(self.ylabel());

		var x_label = enter.append("text")
			.attr("x", self.width() / 2)
			.attr("y", self.height() + 40)
			.attr("text-anchor", "middle")
			.attr("class", axis_label_class)
			.text(self.xlabel());

		if (self.vertxlabel()) {
			x_axis.attr("style", "writing-mode: tb;");
			x_label.attr("x", -10).attr("text-anchor", "end");
		}
	}

	// turns a grid with a click handler into one that will fire when the mouse it dragged over an element
	function make_drawable(self) {
		// whether the mouse is currently down
		var is_mouse_down = false;
		$(document).mousedown(function(e) { is_mouse_down = true; });
		$(document).mouseup(function(e) { is_mouse_down = false; });
		// overwrite mouse filter
		self.mouse_filter = function(isclick) { return isclick || is_mouse_down; }
		return self;
	}

	/*
		Typical usage:

		var c = grid();

		var d = 2d data;

		some_d3_svg_group
			.datum(d)
			.call(c);

	*/
	function grid() {

		// function, cell data -> bool, whether cell should be drawn "active"
		var celltypefn;
		// function, (element, rowdata, coldata) -> bool, callback when a cell is clicked, should return whether it's currently active
		var onclick;

		var do_reevaluate_on_click = false;

		// the axes
		var xaxis = d3.svg.axis()
			.orient("bottom");

		var yaxis = d3.svg.axis()
			.orient("left");

		function self(selection) {
			selection.each(function(d,i) {
				// actual drawing function, d is the data, this is the svg:g.

				var svgg = d3.select(this);

				var all_rows = svgg.selectAll("." + table_row_class)
					.data(d);

				var rows = all_rows.enter().append("g")
					.classed(table_row_class, true)
					.classed(table_editable_class, true)
					.attr("transform", F.apptranslate(0, F.appget(self.yscl(), "rowid")));

				create_axes(d, svgg);
				fill_rows(d, svgg, all_rows);

			});
		}

		self.mouse_filter = function(isclick) { return isclick; }

		function fill_rows(data, svgg, all_rows) {
			var sections = all_rows.selectAll("rect")
					.data(F.getfn("columns"));

			function get_cell_class(coldata) {
				var rowdata = this.parentElement.__data__;
				return celltypefn(rowdata, coldata);
			}

			function onmouseevent(isclick,coldata,i) {
				var rowdata = this.parentElement.__data__;
				if (self.mouse_filter(isclick)) {
					// callback returns whether the current cell is active
					onclick(this, rowdata, coldata);
					if (do_reevaluate_on_click) {
						// have to adjust every cell's class
						svgg.selectAll("." + table_row_class).selectAll("rect")
							.attr("class", get_cell_class);
					} else {
						// still have to look at all the elems in this row because of "new" concepts
						d3.select(this.parentNode).selectAll("rect")
							.attr("class", get_cell_class);
					}
				}
			}

			sections.enter().append("rect")
				.attr("x", F.appget(self.xscl(),"columnid"))
				.attr("width", self.xscl().rangeBand())
				.attr("height", self.yscl().rangeBand())
				.on("mousedown", F.apply(onmouseevent, true))
				.on("mouseover", F.apply(onmouseevent, false));

			sections
				.attr("class", get_cell_class);
		};

		function create_axes(data, svgg) {
			// create background g and axes g if they do not exist

			var enter = svgg.selectAll("." + background_class)
					.data([data])
				.enter().append("g")
					.attr("class", background_class);

			add_axes(self, enter);

			// update the axes

			xaxis
				.tickFormat(self.xticks())
				.scale(self.xscl());
			yaxis
				.tickFormat(self.yticks())
				.scale(self.yscl());

			var bg = svgg.select("." + background_class);
			bg.select("." + x_axis_class).call(xaxis);
			// super hack to rotate text, depends on implementation of d3.axis
			if (self.vertxlabel()) {	
				bg.select("." + x_axis_class).selectAll("g").selectAll("text").attr("text-anchor", "begin");
			}
			bg.select("." + y_axis_class).call(yaxis);
		}

		make_basic_chart(self);

		self.celltypefn = function(f) {
			celltypefn = f;
			return self;
		}

		self.onclick = function(f) {
			onclick = f;
			return self;
		}

		self.do_reevaluate_on_click = function(b) {
			do_reevaluate_on_click = b;
			return self;
		}

		return self;
	}

	function barchart(self, setrectfn) {

		function create_bg(svgg, data) {
			var yaxis = d3.svg.axis()
				.scale(self.yscl())
				.ticks(4)
				.orient("left");

			var xaxis = d3.svg.axis()
				.scale(self.xscl())
				.orient("bottom");

			var enter = svgg.selectAll("." + background_class)
					.data([data])
				.enter().append("g")
					.attr("class", background_class);

			add_axes(self, enter);

			var bg = svgg.select("." + background_class);
			bg.select("." + y_axis_class).call(yaxis);
			bg.select("." + x_axis_class).call(xaxis);
		}

		function create_bars(svgg, data) {
			var enter = svgg.selectAll("." + chart_class)
					.data([data])
				.enter().append("g")
					.attr("class", chart_class);

			var chart = svgg.select("." + chart_class);

			function ypos(d) { return self.yscl()(d.count); }

			function setrect(s) {
				s
					.attr("y", ypos)
					.attr("height", function(d) { return self.height() - self.yscl()(d.count); });
				setrectfn(s);
			}

			var rects = chart.selectAll("rect")
					.data(data)

			setrect(rects.enter().append("rect")
				.attr("x", F.appget(self.xscl(),"level"))
				.attr("width", self.xscl().rangeBand())
			);

			setrect(rects.transition().duration(150));

			function setlabels(s) {
				s
					.attr("y", function(d) { return ypos(d) - 5; })
					.text(F.getfn("count"));
			}

			var labels = chart.selectAll("text")
					.data(data);

			setlabels(labels.enter().append("text")
					.attr("text-anchor", "middle")
					.attr("x", function(d) { return self.xscl()(d.level) + self.xscl().rangeBand() / 2; })
			);

			setlabels(labels.transition().duration(150));
		}

		return {
			create_bg: create_bg,
			create_bars: create_bars
		}
	}

	function overload_barchart() {

		// point at which bars are considered overloaded
		var barfns;
		var svgg;
		var overload_limit;

		function create_overload(svgg) {
			var data = [overload_limit]; // need 1-length data to create enter()
			var enter = svgg.selectAll("." + barchart_extra_class)
					.data(data)
				.enter().append("g")
					.attr("class", barchart_extra_class);

			enter.append("line")
				.attr("class", overload_bar_class)
				.attr("x1", 0)
				.attr("x2", self.width())
				.attr("y1", self.yscl()(overload_limit))
				.attr("y2", self.yscl()(overload_limit));

			var bg = svgg.select("." + barchart_extra_class);
			bg.select("." + overload_bar_class).transition(150)
				.attr("y1", self.yscl()(overload_limit))
				.attr("y2", self.yscl()(overload_limit));
		}


		function setbar(s) {
			s.attr("class", function(d) { return d.count > overload_limit ? count_bar_error_class : count_bar_normal_class; })
		}

		function self(selection) {
			selection.each(function(data,i) {
				// actual drawing function, d is the data, this is the svg:g.
				svgg = d3.select(this);
				barfns.create_bg(svgg, data);
				barfns.create_bars(svgg, data);
			});
		}

		barfns = barchart(self, setbar);
		make_basic_chart(self);

		self.overload_limit = function(v) {
			overload_limit = v;
			create_overload(svgg);
		}

		return self;
	}

	function spline_barchart() {

		var barfns;
		var svgg;
		var onchange;
		var onadd;
		var onremove;
		var control_points;
		var spline;

		function dragfns() {
			var start_y;
			var is_dragging = false;

			function start_drag(d, i) {
				// only drag on left click
				is_dragging = d3.event.sourceEvent.button == 0;
				start_y = parseInt(d3.select(this).attr("cy"));
			}

			function drag_move(d, i) {
				if (!is_dragging) return;

				start_y += d3.event.dy;
				var y = self.yscl().invert(start_y);

				if (y < 0) y = 0;
				if (y > 6) y = 6;

				onchange(d, y);
			}

			return d3.behavior.drag()
				.origin(null)
				.on("dragstart", start_drag)
				.on("drag", drag_move);
		}

		function create_spline() {
			if (!control_points) return;

			spline = M.create_spline(control_points);

			var enter = svgg.selectAll("." + barchart_extra_class)
					.data([control_points])
				.enter().append("g")
					.attr("class", barchart_extra_class);

			enter.append("svg:path")
				.attr("class", "saffron_spline_curve")
				.on("click", function(d,i) {
					// figure out which level was clicked
					var pos = d3.mouse(this.parentNode);
					var lid = Math.floor(pos[0] / self.xscl().rangeBand());
					var val = self.yscl().invert(pos[1]);
					onadd(lid, val);
				});

			var xoffset = self.xscl().rangeBand() / 2;

			var bg = svgg.select("." + barchart_extra_class);

			var cp = bg.selectAll("circle")
				.data(control_points);

			cp.enter().append("circle")
					.attr("class", "saffron_drag_circle")
					.on("click", function(d,i) {
						// middle click
						if (d3.event.button == 1) {
							onremove(i);
						}
					})
					.call(dragfns());

			cp.exit().remove();

			cp
				.attr("cx", function(d) { return self.xscl()(d[0]) + xoffset; })
				.attr("cy", function(d) { return self.yscl()(d[1]); })
				.attr("r", 10);

			var path = d3.svg.line()
				.interpolate("monotone")
				.x(function(d) { return self.xscl()(d) + xoffset; })
				.y(function(d,i) { return self.yscl()(M.eval_spline(spline, i)); });

			bg.selectAll("path")
				.datum(self.xscl().domain())
				.attr("d", path);
		}


		function setbar(s) {
			var close = "#c4c4c4";
			var far = "#bb2222";
			var interp = d3.interpolate(close, far);

			s
				.attr("stroke", "black")
				s.attr("fill", function(d) {
					if (spline) {
						var y = Math.round(M.eval_spline(spline, d.level));
						var diff = Math.abs(y - d.count) / 3;
						return interp(diff);
					} else {
						return close;
					}
				});

		}

		function self(selection) {
			selection.each(function(data,i) {
				// actual drawing function, d is the data, this is the svg:g.
				svgg = d3.select(this);
				barfns.create_bg(svgg, data);
				barfns.create_bars(svgg, data);
				create_spline();
			});
		}

		barfns = barchart(self, setbar);
		make_basic_chart(self);

		self.intensity = function(cp) {
			control_points = cp;
		}

		self.onchange = function(f) {
			onchange = f;
			return self;
		}

		self.onadd = function(f) {
			onadd = f;
			return self;
		}

		self.onremove = function(f) {
			onremove = f;
			return self;
		}

		return self;
	}

	return {
		make_drawable: make_drawable,
		grid: grid,
		celltype: celltype,
		overload_barchart: overload_barchart,
		spline_barchart: spline_barchart
	};
}();

