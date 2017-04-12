/*************************************************************************
 * This library is developed by Yen-Chia Hsu
 * Copyright Yen-Chia Hsu. All rights reserved.
 * GitHub: https://github.com/legenddolphin/eda-viz-js
 * Dependencies: jQuery (http://jquery.com/)
 * Contact: hsu.yenchia@gmail.com
 * License: GNU General Public License v2
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
    // (map the entire value column in the matrix to color codes)
    // 2. If the data matrix is 3D, normalize the values based on each 2D matrix
    // (for each 2D matrix, map its value column to color codes)
    // (e.g. sometimes we only wants to normalize values for each month or week)
    var data = settings["data"];

    // The format takes any user-specified string
    // This is used for creating data attributes on the DOM element
    // e.g. if the format is ["value", "label"],
    // for each DOM element, there will be data-value and data-label attributes
    var format = settings["format"];

    // The column index in the data matrix for showing labels under each block
    var data_index_for_labels = typeof settings["dataIndexForLabels"] == "undefined" ? 0 : settings["dataIndexForLabels"];

    // The column index in the data matrix for coding the color of each block
    var data_index_for_values = typeof settings["dataIndexForValues"] == "undefined" ? 1 : settings["dataIndexForValues"];

    // The callback event that will be fired when users click on a block
    var click_event_callback = settings["click"];

    // The callback event that will be fired when a block is selected
    var select_event_callback = settings["select"];

    // Cache DOM elements
    var $chart_container = $("#" + chart_container_id);
    var $flat_block_chart_value;
    var $flat_block_chart_label;
    var $flat_blocks;

    // Parameters
    var flat_block_chart_touched = false;
    var flat_block_chart_touched_position = {};

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

      // Get all values
      var values = [];
      for (var i = 0; i < batch.length; i++) {
        values.push(batch[i][data_index_for_values])
      }

      // Perform data transformation
      var values = powerTransform(values);
      var max_val = Math.max.apply(null, values);
      var min_val = Math.min.apply(null, values);

      // Plot blocks
      for (var i = 0; i < batch.length; i++) {
        var pt = batch[i];
        var label = pt[data_index_for_labels];
        var value = pt[data_index_for_values];
        var color = valueToGrayLevel(value, max_val, min_val);
        var color_str = "style='background-color: rgb(" + color + "," + color + "," + color + ")' ";
        var data_str = "data-index='" + (i + previous_index) + "' ";
        for (var j = 0; j < format.length; j++) {
          data_str += "data-" + format[j] + "='" + pt[j] + "' ";
        }
        $flat_block_chart_value.append($("<td><div class='flat-block' " + color_str + data_str + "></div></td>"));
        $flat_block_chart_label.append($("<td>" + label + "</td>"));
      }
    }

    function addEvents() {
      $flat_blocks = $flat_block_chart_value.find(".flat-block");

      $flat_blocks.on("click touchend", function (e) {
        if (e.type == "click") flat_block_chart_touched = true;
        if (flat_block_chart_touched) {
          var $this = $(this);
          selectBlock($this, false);
          if (typeof (click_event_callback) == "function") {
            click_event_callback($this);
          }
        }
      });

      $flat_blocks.on('touchstart', function (e) {
        flat_block_chart_touched_position = {x: e.originalEvent.touches[0].pageX, y: e.originalEvent.touches[0].pageY};
        flat_block_chart_touched = true;
      });

      $flat_blocks.on('touchmove', function (e) {
        if (Math.abs(flat_block_chart_touched_position.x - e.originalEvent.touches[0].pageX) >= 2 || Math.abs(flat_block_chart_touched_position.y - e.originalEvent.touches[0].pageY) >= 2) {
          flat_block_chart_touched = false;
        }
      });
    }

    function valueToGrayLevel(value, max_val, min_val) {
      // Linear mapping from value to gray scale
      return Math.round(255 - value * (255 / (max_val - min_val)));
    }

    function selectBlock($ele, auto_scroll) {
      if ($ele && !$ele.hasClass("selected-block")) {
        clearBlockSelection();
        $ele.addClass("selected-block");
        if (auto_scroll) {
          $chart_container.scrollLeft(Math.round($ele.parent().position().left - $chart_container.width() / 5));
        }
        if (typeof (select_event_callback) == "function") {
          select_event_callback($ele);
        }
      }
    }

    function clearBlockSelection() {
      if ($flat_blocks.hasClass("selected-block")) {
        $flat_blocks.removeClass("selected-block");
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
      selectBlock($($flat_blocks.filter("div[data-index=" + index + "]")[0]), true);
    };
    this.selectBlockByIndex = selectBlockByIndex;

    var selectLastBlock = function () {
      selectBlockByIndex($flat_blocks.length - 1);
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