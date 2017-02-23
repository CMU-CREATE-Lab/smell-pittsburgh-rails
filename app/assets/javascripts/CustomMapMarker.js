/*************************************************************************
 * This class is developed by Yen-Chia Hsu
 * Dependencies: jQuery and Google Maps JavaScript API
 *************************************************************************/

(function () {
  "use strict";

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Create the class
  //
  var CustomMapMarker = function (settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //
    var marker_type = settings["type"];
    var data = settings["data"];
    var init_zoom_level = settings["initZoomLevel"];
    var click_event_callback = settings["click"];

    var google_map_marker;
    var html_content;
    var this_obj = this;

    // Smell Marker
    var smell_marker_default_opacity = 1;
    var current_icon_size;
    var zoom_level_to_icon_size = [
      24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 36, 60, 90, 180, 240, 360
    ];
    var smell_value_to_text = [
      "Just fine!",
      "Barely noticeable",
      "Definitely noticeable",
      "It's getting pretty bad",
      "About as bad as it gets!"
    ];

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function init() {
      if (marker_type == "smell") {
        drawSmellMarker();
      }
    }

    function drawSmellMarker() {
      var date_str = (new Date(data["created_at"] * 1000)).toLocaleString();
      var feelings_symptoms = data["feelings_symptoms"] ? data["feelings_symptoms"] : "No data.";
      var smell_description = data["smell_description"] ? data["smell_description"] : "No data.";
      var smell_value = data["smell_value"];

      current_icon_size = zoom_level_to_icon_size[init_zoom_level];
      html_content = "";
      html_content += "<b>Date:</b> " + date_str + "<br>";
      html_content += "<b>Smell Rating:</b> " + smell_value + " (" + smell_value_to_text[smell_value - 1] + ")<br>";
      html_content += "<b>Symptoms:</b> " + feelings_symptoms + "<br>";
      html_content += "<b>Smell Description:</b> " + smell_description;

      // Add Google map marker
      google_map_marker = new google.maps.Marker({
        position: new google.maps.LatLng({lat: data["latitude"], lng: data["longitude"]}),
        icon: generateSmellIcon(smell_value, init_zoom_level, current_icon_size),
        zIndex: smell_value,
        opacity: smell_marker_default_opacity
      });

      // Add marker event
      google_map_marker.addListener("click", function () {
        if (typeof (click_event_callback) == "function") {
          click_event_callback(this_obj);
        }
      });
    }

    function generateSmellIcon(smell_value, zoom_level, icon_size) {
      var icon_size_half = icon_size / 2;

      return {
        url: getSmellIconURL(smell_value, zoom_level),
        scaledSize: new google.maps.Size(icon_size, icon_size),
        size: new google.maps.Size(icon_size, icon_size),
        anchor: new google.maps.Point(icon_size_half, icon_size_half),
        origin: new google.maps.Point(0, 0)
      };
    }

    function getSmellIconURL(smell_value, zoom_level) {
      var path = "/img/";
      var smell_icon_small = ["smell_1.png", "smell_2.png", "smell_3.png", "smell_4.png", "smell_5.png"];
      var smell_icon_med = ["smell_1_med.png", "smell_2_med.png", "smell_3_med.png", "smell_4_med.png", "smell_5_med.png"];
      var smell_icon_big = ["smell_1_big.png", "smell_2_big.png", "smell_3_big.png", "smell_4_big.png", "smell_5_big.png"];
      var smell_icon;

      // The range of smell value is from 1 to 5
      if (zoom_level >= 20) {
        smell_icon = smell_icon_big[smell_value - 1];
      } else if (zoom_level < 20 && zoom_level >= 17) {
        smell_icon = smell_icon_med[smell_value - 1];
      } else {
        smell_icon = smell_icon_small[smell_value - 1];
      }

      return path + smell_icon;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Privileged methods
    //
    var updateIconByZoomLevel = function (zoom_level) {
      if (marker_type == "smell") {
        var desired_icon_size = zoom_level_to_icon_size[zoom_level];
        if (current_icon_size == desired_icon_size) return;
        current_icon_size = desired_icon_size;
        google_map_marker.setIcon(generateSmellIcon(data["smell_value"], zoom_level, desired_icon_size));
      }
    };
    this.updateIconByZoomLevel = updateIconByZoomLevel;

    var reset = function () {
      if (marker_type == "smell") {
        google_map_marker.setOpacity(smell_marker_default_opacity);
        google_map_marker.setZIndex(data["smell_value"]);
      }
    };
    this.reset = reset;

    var getTimestamp = function () {
      if (marker_type == "smell") {
        return data["created_at"];
      }
    }
    this.getTimestamp = getTimestamp;

    var getSmellValue = function() {
      if (marker_type == "smell") {
        return data["smell_value"];
      }
    };
    this.getSmellValue = getSmellValue;

    var getContent = function () {
      return html_content;
    };
    this.getContent = getContent;

    var getData = function () {
      return data;
    };
    this.getData = getData;

    var setMap = function (google_map) {
      google_map_marker.setMap(google_map);
    };
    this.setMap = setMap;

    var setZIndex = function (z_index) {
      google_map_marker.setZIndex(z_index);
    };
    this.setZIndex = setZIndex;

    var setOpacity = function (opacity) {
      google_map_marker.setOpacity(opacity);
    };
    this.setOpacity = setOpacity;

    var getGoogleMapMarker = function () {
      return google_map_marker;
    };
    this.getGoogleMapMarker = getGoogleMapMarker;

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
  if (!window.CustomMapMarker) {
    window.CustomMapMarker = CustomMapMarker;
  }
})();