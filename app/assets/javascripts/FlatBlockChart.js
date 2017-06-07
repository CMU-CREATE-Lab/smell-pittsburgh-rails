/*************************************************************************
 * This library is developed by Yen-Chia Hsu
 * Copyright Yen-Chia Hsu. All rights reserved.
 * GitHub: https://github.com/yenchiah/eda-viz-js
 * Dependencies: jQuery (http://jquery.com/)
 * Contact: hsu.yenchia@gmail.com
 * License: GNU General Public License v2
 * Version: v1.0
 *************************************************************************/

(function () {
  "use strict";

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Create the class
  //
  var FlatBlockChart = function (chart_container_id, settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //

    // The data can be a 2D or 3D matrix:
    // 1. If the data matrix is 2D, normalize the values based on the entire matrix
    // (columns are variables and rows are observations)
    // (map the entire color column in the matrix to color codes)
    // (map the entire height column in the matrix to height of the blocks)
    // 2. If the data matrix is 3D, normalize the values based on each 2D matrix
    // (for each 2D matrix, map its color column to color codes)
    // (for each 2D matrix, map its height column to height of the blocks)
    // (e.g. sometimes we only wants to normalize values for each month or week)
    var data = settings["data"];

    // The format takes any user-specified string
    // This is used for creating data attributes on the DOM element
    // e.g. if the format is ["label", "color", "height"],
    // for each DOM element, there will be data-label, data-color, and data-height attributes
    var format = settings["format"];

    // The column index in the data matrix for showing labels under each block
    var data_index_for_labels = typeof settings["dataIndexForLabels"] == "undefined" ? 0 : settings["dataIndexForLabels"];

    // The column index in the data matrix for coding the color of each block
    var data_index_for_colors = typeof settings["dataIndexForColors"] == "undefined" ? 1 : settings["dataIndexForColors"];

    // The column index in the data matrix for coding the height of each block (optional field)
    var data_index_for_heights = settings["dataIndexForHeights"];

    // The callback event that will be fired when users click on a block
    var click_event_callback = settings["click"];

    // The callback event that will be fired when a block is selected
    var select_event_callback = settings["select"];

    // The bin and range of the color that will be used to render the blocks
    var use_color_quantiles = typeof settings["useColorQuantiles"] == "undefined" ? false : settings["useColorQuantiles"];
    var color_bin = typeof settings["colorBin"] == "undefined" ? [1, 2, 2.5, 3, 3.5] : settings["colorBin"];
    var color_range = typeof settings["colorRange"] == "undefined" ? ["#dcdcdc", "#52b947", "#f3ec19", "#f57e20", "#ed1f24", "#991b4f"] : settings["colorRange"];

    // The bin and range of the height that will be used to render the blocks
    var height_bin = typeof settings["heightBin"] == "undefined" ? [10, 20] : settings["heightBin"];
    var height_range = typeof settings["heightRange"] == "undefined" ? ["33%", "66%", "100%"] : settings["heightRange"];

    // Cache DOM elements
    var $chart_container = $("#" + chart_container_id);
    var $flat_block_chart_value;
    var $flat_block_chart_label;
    var $flat_blocks_click_region;

    // Parameters
    var flat_block_chart_touched = false;
    var flat_block_chart_touched_position = {};
    var selected_block_class = use_color_quantiles ? "selected-block-no-color" : "selected-block";

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function init() {
      var html = "";

      html += "<table class='flat-block-chart'>";
      html += "  <tr class='flat-block-chart-value'></tr>";
      html += "  <tr class='flat-block-chart-label'></tr>";
      html += "</table>";
      $chart_container.append($(html));

      $flat_block_chart_value = $("#" + chart_container_id + " .flat-block-chart-value");
      $flat_block_chart_label = $("#" + chart_container_id + " .flat-block-chart-label");

      plot();
      addEvents();
    }

    function plot() {
      // Check if data is 2D or 3D
      var is_data_matrix_2d = typeof data[0][0] != "object";
      if (is_data_matrix_2d) {
        // The entire 2D data matrix is a batch
        plotOneBatch(data);
      } else {
        // Each 2D matrix in the 3D data matrix is a batch
        var previous_index = 0;
        for (var i = 0; i < data.length; i++) {
          plotOneBatch(data[i], previous_index);
          previous_index += data[i].length;
        }
      }
    }

    function plotOneBatch(batch, previous_index) {
      if (typeof previous_index == "undefined") {
        previous_index = 0;
      }

      if (!use_color_quantiles) {
        // Get all color values
        var color_vals = [];
        for (var i = 0; i < batch.length; i++) {
          color_vals.push(batch[i][data_index_for_colors])
        }
        var color_vals = powerTransform(color_vals);
        var max_color_val = Math.max.apply(null, color_vals);
        var min_color_val = Math.min.apply(null, color_vals);
      }

      // Plot blocks
      for (var i = 0; i < batch.length; i++) {
        var pt = batch[i];
        // Add color string
        var color_val = pt[data_index_for_colors];
        var color_str;
        if (use_color_quantiles) {
          var color = valueToQuantile(color_val, color_bin, color_range);
          color_str = "background-color:" + color + ";";
        } else {
          var color = valueToGrayLevel(color_val, max_color_val, min_color_val);
          color_str = "background-color:rgb(" + color + "," + color + "," + color + ");";
        }
        // Add height string
        var height_val = pt[data_index_for_heights];
        var height = valueToQuantile(height_val, height_bin, height_range);
        var height_str = "height:" + height + ";";
        // Add data string
        var data_str = "data-index='" + (i + previous_index) + "' ";
        for (var j = 0; j < format.length; j++) {
          data_str += "data-" + format[j] + "='" + pt[j] + "' ";
        }
        // Add block
        var style_str = "style='" + color_str + height_str + "' ";
        var block_str = "<div class='flat-block' " + style_str + "></div>";
        var block_click_region_str = "<div class='flat-block-click-region' " + data_str + "></div>";
        $flat_block_chart_value.append($("<td>" + block_str + block_click_region_str + "</td>"));
        // Add label
        var label = pt[data_index_for_labels];
        $flat_block_chart_label.append($("<td>" + label + "</td>"));
      }
    }

    function addEvents() {
      $flat_blocks_click_region = $flat_block_chart_value.find(".flat-block-click-region");

      $flat_blocks_click_region.on("click touchend", function (e) {
        if (e.type == "click") flat_block_chart_touched = true;
        if (flat_block_chart_touched) {
          var $this = $(this);
          selectBlock($this, false);
          if (typeof (click_event_callback) == "function") {
            click_event_callback($this);
          }
        }
      });

      $flat_blocks_click_region.on('touchstart', function (e) {
        flat_block_chart_touched_position = {x: e.originalEvent.touches[0].pageX, y: e.originalEvent.touches[0].pageY};
        flat_block_chart_touched = true;
      });

      $flat_blocks_click_region.on('touchmove', function (e) {
        if (Math.abs(flat_block_chart_touched_position.x - e.originalEvent.touches[0].pageX) >= 2 || Math.abs(flat_block_chart_touched_position.y - e.originalEvent.touches[0].pageY) >= 2) {
          flat_block_chart_touched = false;
        }
      });
    }

    function valueToQuantile(value, bin, range) {
      if (value <= bin[0]) {
        return range[0];
      } else if (value > bin[bin.length - 1]) {
        return range[range.length - 1];
      } else {
        for (var i = 0; i < bin.length - 1; i++) {
          if (value > bin[i] && value <= bin[i + 1]) {
            return range[i + 1];
          }
        }
      }
    }

    function valueToGrayLevel(value, max_val, min_val) {
      // Linear mapping from value to gray scale
      return Math.round(255 - value * (255 / (max_val - min_val)));
    }

    function selectBlock($ele, auto_scroll) {
      if ($ele && !$ele.hasClass(selected_block_class)) {
        clearBlockSelection();
        $ele.addClass(selected_block_class);
        if (auto_scroll) {
          $chart_container.scrollLeft(Math.round($ele.parent().position().left - $chart_container.width() / 5));
        }
        if (typeof (select_event_callback) == "function") {
          select_event_callback($ele);
        }
      }
    }

    function clearBlockSelection() {
      if ($flat_blocks_click_region.hasClass(selected_block_class)) {
        $flat_blocks_click_region.removeClass(selected_block_class);
      }
    }

    function powerTransform(values) {
      // Compute geometric mean
      var values_new = [];
      var product = 1;
      var count = 0;
      var n = values.length;
      for (var i = 0; i < n; i++) {
        var x = values[i];
        if (x > 0) {
          product *= x;
          count += 1;
        }
      }
      var gm = Math.pow(product, 1 / count);

      // Transform data
      for (var i = 0; i < n; i++) {
        var x = values[i];
        if (x > 0) {
          values_new.push(gm * Math.log(values[i]))
        } else {
          values_new.push(0);
        }
      }

      return values_new;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Privileged methods
    //

    // tanh is not defined before Chrome 38
    // which means that Android <= 4.4.x will
    // throw an error when we attempt to use it;
    // so here is a pollyfill.
    var tanh_func = function (x) {
      if (x === Infinity) {
        return 1;
      } else if (x === -Infinity) {
        return -1;
      } else {
        var y = Math.exp(2 * x);
        return (y - 1) / (y + 1);
      }
    };
    Math.tanh = Math.tanh || tanh_func;

    var selectBlockByIndex = function (index) {
      selectBlock($($flat_blocks_click_region.filter("div[data-index=" + index + "]")[0]), true);
    };
    this.selectBlockByIndex = selectBlockByIndex;

    var selectLastBlock = function () {
      selectBlockByIndex($flat_blocks_click_region.length - 1);
    };
    this.selectLastBlock = selectLastBlock;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor
    //
    init();
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Register to window
  //
  if (window.EdaVizJS) {
    window.EdaVizJS.FlatBlockChart = FlatBlockChart;
  } else {
    window.EdaVizJS = {};
    window.EdaVizJS.FlatBlockChart = FlatBlockChart;
  }
})();
