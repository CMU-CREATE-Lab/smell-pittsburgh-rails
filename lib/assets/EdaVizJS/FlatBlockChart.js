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
    var data = settings["data"];
    var format = settings["format"];
    var data_index_for_labels = typeof settings["dataIndexForLabels"] == "undefined" ? 0 : settings["dataIndexForLabels"];
    var data_index_for_values = typeof settings["dataIndexForValues"] == "undefined" ? 1 : settings["dataIndexForValues"];
    var click_event_callback = settings["click"];
    var select_event_callback = settings["select"];

    var $chart_container = $("#" + chart_container_id);
    var $flat_block_chart_value;
    var $flat_block_chart_label;
    var $flat_blocks;

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
      for (var i = 0; i < data.length; i++) {
        var pt = data[i];
        var label = pt[data_index_for_labels];
        var value = pt[data_index_for_values];
        var color = valueToGrayLevel(value);
        var color_str = "style='background-color: rgb(" + color + "," + color + "," + color + ")' ";
        var data_str = "data-index='" + i + "' ";
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

    function valueToGrayLevel(value) {
      return Math.round((0.95 - Math.tanh(value / 5)) * 255);
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