"use strict";

function init() {
  $.ajax({
    "url": genSmellURL(),
    "success": function (data) {
      var chart_data = [];
      for (var i = 0; i < data["day"].length; i++) {
        chart_data.push({
          "date": new Date(data["day"][i]),
          "count": data["count"][i]
        });
      }
      createCalendarHeatmap(chart_data);
    },
    "error": function (response) {
      console.log("server error:", response);
    }
  });
}

function createCalendarHeatmap(data) {
  // Choose color by using http://colorbrewer2.org/
  var heatmap = calendarHeatmap()
    .data(data)
    .selector(".container")
    .tooltipEnabled(true)
    .legendEnabled(false)
    .onClick(function (d) {
      console.log(d);
    });
  heatmap();  // render the chart
}

function genSmellURL() {
  var min_smell_value = 3;
  var timezone_offset = new Date().getTimezoneOffset();
  var api_paras = "aggregate=day&min_smell_value=" + min_smell_value + "&timezone_offset=" + timezone_offset;
  var api_url = "/api/v1/smell_reports?";
  var root_url = window.location.origin;
  return root_url + api_url + api_paras;
}

$(init);