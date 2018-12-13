/*************************************************************************
 * This class is developed by Yen-Chia Hsu
 * Dependencies: CustomMapMarker, jQuery, and Google Maps JavaScript API
 *************************************************************************/

(function () {
  "use strict";

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Create the class
  //
  var AnimateCustomMapMarker = function (settings) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //
    settings = safeGet(settings, {});
    var animate_smell_text = safeGet(settings["animate_smell_text"], false);
    var before_play = settings["before_play"];
    var when_play = settings["when_play"];
    var reset_play = settings["reset_play"];
    var after_pause = settings["after_pause"];
    var after_resume = settings["after_resume"];
    var after_stop = settings["after_stop"];

    var isPlaying = false;
    var isDwelling = false;
    var isPaused = false;
    var animate_interval = null;
    var animation_labels;

    var frames_per_sec = 60;
    var secs_to_animate_one_day = 30;
    var increments_per_frame = Math.round(86400000 / (secs_to_animate_one_day * frames_per_sec));
    var interval = 1000 / frames_per_sec;
    var marker_fade_milisec = 1000;
    var dwell_sec = 2;
    var dwell_increments = dwell_sec * frames_per_sec * increments_per_frame;

    // An array of smell markers created with CustomMapMarker.js
    var smell_markers;

    // A table (2D array) of sensor markers created with CustomMapMarker.js
    var sensor_marker_table;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    function init() {
      animation_labels = getAnimationLabels();
    }

    function showMarker(marker, map) {
      if (typeof map === "undefined" || typeof marker === "undefined") return;
      marker.setMap(map);
    }

    function hideMarker(marker, map) {
      if (typeof map === "undefined" || typeof marker === "undefined") return;
      marker.setMap(null);
      marker.reset();
    }

    function hideMarkerArray(marker_array, map) {
      if (typeof map === "undefined" || typeof marker_array === "undefined") return;
      for (var i = 0; i < marker_array.length; i++) {
        hideMarker(marker_array[i], map);
      }
    }

    function hideMarkerTable(marker_table, map) {
      if (typeof map === "undefined" || typeof marker_table === "undefined") return;
      for (var i = 0; i < marker_table.length; i++) {
        hideMarkerArray(marker_table[i], map);
      }
    }

    function showText(marker, map) {
      if (typeof map === "undefined" || typeof marker === "undefined") return;

      // Get smell data
      var marker_data = marker.getData();
      if (marker_data["smell_value"] < 3) return;

      // Merge message
      var msg = "";
      if (marker_data["smell_description"] != null) {
        msg += marker_data["smell_description"];
      }
      if (marker_data["feelings_symptoms"] != null) {
        if (msg != "") msg += " / ";
        msg += marker_data["feelings_symptoms"];
      }
      if (msg == "" || msg.length < 60) return;

      // Create information box
      var infobox = new InfoBox({
        pixelOffset: new google.maps.Size(-131, -13),
        disableAutoPan: true,
        alignBottom: true,
        closeBoxURL: "",
        pane: "floatPane",
        zIndex: 10,
        boxClass: "animation-infobox",
        boxStyle: {
          opacity: 3.2
        }
      });
      infobox.setContent(msg);
      infobox.open(map, marker.getGoogleMapMarker());
      fadeInfoBox(infobox, 50);
    }

    function getAnimationLabels() {
      var labels = [];
      // One bin is equal to 30 minutes
      var increments = 86400000 / 48;
      var milisec = increments;
      for (var i = 0; i < 48; i++) {
        var hour = Math.floor(i / 2);
        var minute = (i % 2) * 30;
        labels.push({
          text: ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2),
          milisec: milisec
        });
        milisec += increments;
      }
      return labels;
    }

    function fadeMarker(marker, time) {
      setTimeout(function () {
        if (isPlaying && isPaused) {
          fadeMarker(marker, time);
          return;
        }
        if (isPlaying && !isDwelling) {
          marker.setZIndex(0);
          marker.setOpacity(0.5);
        }
      }, time);
    }

    function fadeInfoBox(infobox, time) {
      setTimeout(function () {
        if (!isPlaying) {
          infobox.setVisible(false);
          infobox.close();
          return;
        }
        var opacity = infobox["boxStyle_"]["opacity"];
        if (opacity > 0) {
          opacity -= 0.05;
          infobox.setOptions({boxStyle: {opacity: opacity}});
          fadeInfoBox(infobox, time);
        } else {
          infobox.setVisible(false);
          infobox.close();
        }
      }, time);
    }

    // Safely get the value from a variable, return a default value if undefined
    function safeGet(v, default_val) {
      if (typeof default_val === "undefined") default_val = "";
      return (typeof v === "undefined") ? default_val : v;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    this.startAnimation = function (settings) {
      var map = settings["map"]; // the map for showing the marker
      if (typeof map === "undefined") return;

      if (isPlaying) return;
      isPlaying = true;
      isPaused = false;

      smell_markers = safeGet(settings["smell_markers"], []);
      sensor_marker_table = safeGet(settings["sensor_marker_table"], []);
      current_epochtime_milisec = safeGet(settings["current_epochtime_milisec"], 0);

      if (animate_interval != null || (smell_markers.length == 0 && sensor_marker_table[0].length == 0)) return;

      // Initialize animation
      var smell_idx;
      var sensor_idx_array;
      var sensor_idx_array_on_map;
      var elapsed_milisec;
      var label_idx;
      if (typeof before_play === "function") {
        before_play();
      }
      var resetAnimation = function () {
        isDwelling = false;
        smell_idx = 0;
        sensor_idx_array = [];
        for (var i = 0; i < sensor_marker_table.length; i++) {
          sensor_idx_array[i] = 0;
        }
        sensor_idx_array_on_map = [];
        elapsed_milisec = 0;
        label_idx = 0;
      };
      resetAnimation();

      // Start animation
      if (typeof when_play === "function") {
        when_play(animation_labels[label_idx]["text"]);
      }
      animate_interval = setInterval(function () {
        if (isPaused) return;
        if (elapsed_milisec < 86400000) {
          ///////////////////////////////////////////////////////////////////////////////
          // This condition means we need to animate smell reports and sensors
          // Check all smell reports that are not on the map
          // Show a smell report only if it has time less than the current elapsed time
          // This logic assumes that the smell markers are sorted by time (from low to high)
          if (smell_idx < smell_markers.length) {
            for (var i = smell_idx; i < smell_markers.length; i++) {
              var smell_m = smell_markers[i];
              var smell_m_data = smell_m.getData();
              var smell_epochtime_milisec = smell_m_data["observed_at"] * 1000;
              if (smell_epochtime_milisec <= (current_epochtime_milisec + elapsed_milisec)) {
                showMarker(smell_m, map);
                if (animate_smell_text) showText(smell_m, map);
                fadeMarker(smell_m, marker_fade_milisec);
                smell_idx += 1;
              } else {
                break;
              }
            }
          }
          // Show sensors
          // This logic assumes that the sensor markers are sorted by time (from low to high)
          for (var j = 0; j < sensor_marker_table.length; j++) {
            var sensor_idx = sensor_idx_array[j];
            var sensor_markers = sensor_marker_table[j];
            if (sensor_idx < sensor_markers.length) {
              var sensor_m = sensor_markers[sensor_idx];
              var sensor_m_data = sensor_m.getData();
              var sensor_epochtime_milisec;
              if (typeof sensor_m_data["sensor_data_time"] != "undefined") {
                sensor_epochtime_milisec = sensor_m_data["sensor_data_time"];
              } else {
                sensor_epochtime_milisec = sensor_m_data["wind_data_time"];
              }
              if (sensor_epochtime_milisec <= (current_epochtime_milisec + elapsed_milisec)) {
                // Show current sensor marker
                showMarker(sensor_m, map);
                // Hide previous sensor marker
                if (typeof sensor_idx_array_on_map[j] != "undefined") {
                  hideMarker(sensor_markers[sensor_idx_array_on_map[j]], map);
                }
                // Save index
                sensor_idx_array_on_map[j] = sensor_idx_array[j];
                sensor_idx_array[j] += 1;
              }
            }
          }
          if (elapsed_milisec >= animation_labels[label_idx]["milisec"]) {
            label_idx += 1;
            if (typeof when_play === "function") {
              when_play(animation_labels[label_idx]["text"]);
            }
          }
        } else {
          ///////////////////////////////////////////////////////////////////////////////
          // This condition means we are pausing the animation and do nothing
          isDwelling = true;
        }
        if (elapsed_milisec > 86400000 + dwell_increments) {
          ///////////////////////////////////////////////////////////////////////////////
          // This condition means we have animated all smell reports and sensors in one day
          // So we need to reset parameters for the next animation
          resetAnimation();
          hideMarkerArray(smell_markers, map);
          hideMarkerTable(sensor_marker_table, map);
          if (typeof reset_play === "function") {
            reset_play(animation_labels[label_idx]["text"]);
          }
        }
        elapsed_milisec += increments_per_frame;
      }, interval);
    };

    this.pauseAnimation = function () {
      if (!isPlaying || isPaused) return;
      isPaused = true;
      if (typeof after_pause === "function") {
        after_pause();
      }
    };

    this.resumeAnimation = function () {
      if (!isPlaying || !isPaused) return;
      isPaused = false;
      if (typeof after_resume === "function") {
        after_resume();
      }
    };

    this.stopAnimation = function () {
      if (!isPlaying) return;
      isPlaying = false;
      isDwelling = false;
      isPaused = false;
      if (animate_interval != null) {
        clearInterval(animate_interval);
        animate_interval = null;
      }
      hideMarkerArray(smell_markers, map);
      hideMarkerTable(sensor_marker_table, map);
      if (typeof after_stop === "function") {
        after_stop();
      }
    };

    this.isPlaying = function () {
      return isPlaying;
    };

    this.isPaused = function () {
      return isPaused;
    };

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
  if (!window.AnimateCustomMapMarker) {
    window.AnimateCustomMapMarker = AnimateCustomMapMarker;
  }
})();