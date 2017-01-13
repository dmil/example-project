// self-executing anonymous function to prevent any of this code
// from conflicting with chart2.js, chart3.js etc.

(function () {
  var svg = d3.select("#chart1");
  var margin = {top: 20, right: 20, bottom: 30, left: 50};
  var width = +svg.attr("width") - margin.left - margin.right;
  var height = +svg.attr("height") - margin.top - margin.bottom;

  // define an svg 'group' element
  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
  var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // defines the type of x and y scale that will be used in the graph
  // https://github.com/d3/d3-scale
  // https://github.com/d3/d3-scale#scaleLinear
  // https://github.com/d3/d3-scale#scaleTime
  var x = d3.scaleTime().rangeRound([0, width]);
  var y = d3.scaleLinear().rangeRound([height, 0]);

  // constructs a line
  // https://github.com/d3/d3-shape
  // https://github.com/d3/d3-shape#line
  // https://github.com/d3/d3-shape#line_x
  // https://github.com/d3/d3-shape#line_y
  var line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });

  // defines date time format used in the tsv file
  // https://github.com/d3/d3-time-format
  // %d - zero-padded day of the month as a decimal number [01,31].
  // %b - abbreviated month name.
  // %y - year without century as a decimal number [00,99]
  var parseTime = d3.timeParse("%Y-%m-%d");
  var bisectDate = d3.bisector(function(d) { return d.date; }).left;
  var formatValue = d3.format(",.2f");
  var formatCurrency = function(d) { return "$" + formatValue(d); };

  // download data.tsv and parse
  d3.tsv("chart1/data.tsv", function(d) {
    d.date = parseTime(d.date);
    d.close = +d.close; // force d.close to be numeric
    return d;
  }, function(error, data) {
      if (error) throw error;

      // get the maximum and minimum of each column and set that as the
      // input 'domain' for the x and y axis
      // http://www.intmath.com/functions-and-graphs/2a-domain-and-range.php
      // https://github.com/d3/d3-array#extent
      // https://github.com/d3/d3-scale/blob/master/README.md#continuous_domain
      // https://github.com/d3/d3-scale/blob/master/README.md#time_domain
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain(d3.extent(data, function(d) { return d.close; }));

      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end")
        .text("Price ($)");

      g.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);

      var focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");

      focus.append("circle")
        .attr("r", 4.5);

      focus.append("text")
        .attr("class", "hover-text")
        .attr("x", 9)
        .attr("dy", ".35em");

      g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

      function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
        focus.select("text").text(formatCurrency(d.close));
      }
  });

}());
