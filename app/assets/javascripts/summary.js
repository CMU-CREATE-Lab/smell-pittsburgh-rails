"use strict";

var start_time = 1464753600;

function init() {
  // Load smell reports
  $.ajax({
    "url": genSmellURL(start_time),
    "success": function (response) {
      var chart_data = [];
      for (var i = 0; i < response["day"].length; i++) {
        chart_data.push({
          "date": new Date(response["day"][i]),
          "count": parseInt(response["count"][i])
        });
      }
      createCalendarHeatmap(chart_data, ".smell", [0, 1, 10, 20, 30], "report", true);
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
  // Load ESDR
  $.ajax({
    "url": genEsdrURL(start_time),
    "success": function (response) {
      var data = response["data"];
      var chart_data = [];
      for (var i = 0; i < data.length; i++) {
        chart_data.push({
          "date": new Date(data[i][0] * 1000),
          "count": parseInt(data[i][1])
        });
      }
      createCalendarHeatmap(chart_data, ".PM", [0, 12, 35.4, 55.4, 150.4], "μg/m<sup>3</sup>", false);
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
}

function createCalendarHeatmap(data, container, color_bin, unit, unit_plural_enabled) {
  // Choose color by using http://colorbrewer2.org/
  var heatmap = new CalendarHeatmap()
    .data(data)
    .startDate(new Date(start_time * 1000))
    .selector(container)
    .colorBin(color_bin)
    .tooltipEnabled(true)
    .tooltipUnit(unit)
    .legendEnabled(false)
    .tooltipUnitPluralEnabled(unit_plural_enabled)
    .onClick(function (d) {
      console.log(d);
    });
  heatmap(); // render the chart
}

function genEsdrURL(from_time) {
  var esdr_root_url = "https://esdr.cmucreatelab.org";
  var api_url = "/api/v1/";
  var api_paras = "feeds/29/channels/PM25_UG_M3_daily_max/export?from=" + from_time + "&format=json";
  return esdr_root_url + api_url + api_paras;
}

function genSmellURL(from_time) {
  var min_smell_value = 3;
  var timezone_offset = new Date().getTimezoneOffset();
  var api_paras = "aggregate=day";
  api_paras += "&min_smell_value=" + min_smell_value;
  api_paras += "&timezone_offset=" + timezone_offset;
  api_paras += "&start_time=" + from_time;
  var api_url = "/api/v1/smell_reports?";
  var root_url = window.location.origin;
  return root_url + api_url + api_paras;
}

$(init);
