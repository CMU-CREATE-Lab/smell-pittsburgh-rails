/*************************************************************************
 * Widgets for building interactive web applications
 * Version: v1.0
 *************************************************************************/

(function () {
  "use strict";

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Create the class
  //
  var Widgets = function () {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    // Safely get the value from a variable, return a default value if undefined
    function safeGet(v, default_val) {
      if (typeof default_val === "undefined") default_val = "";
      return (typeof v === "undefined") ? default_val : v;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Privileged methods
    //
    function createCustomDialog(settings) {
      settings = safeGet(settings, {});

      // Create a button for taking actions (e.g., confirm that users get the message)
      // The default text for the button is "Confirm"
      var has_action = (typeof settings["action_callback"] === "function");
      var action_text = safeGet(settings["action_text"], "Confirm");

      // Create a button for cancellation
      // The default text for the button is "Cancel" when there is an action button
      // The default text for the button is "Ok" when there is no action button
      var cancel_text = has_action ? "Cancel" : "Ok";
      cancel_text = safeGet(settings["cancel_text"], cancel_text);

      // Specify the style
      // If "flat", using the flat style (for mobile applications)
      var style_class = safeGet(settings["style"]) == "flat" ? "custom-dialog-flat" : "custom-dialog";

      // Specify the parent of the dialog
      var $parent = safeGet(settings["parent"], $(body));

      // Specify the selector of the dialog
      // If no selector, a <div></div> will be created
      var $selector = $(safeGet(settings["selector"], "<div></div>"));

      // Specify the width of the dialog
      // If no width, the default value will be 280
      var width = safeGet(settings["width"], 280);

      var buttons = {
        "Cancel": {
          class: "ui-cancel-button",
          text: cancel_text,
          click: function () {
            $(this).dialog("close");
          }
        }
      };
      if (has_action) {
        buttons["Action"] = {
          class: "ui-action-button",
          text: action_text,
          click: function () {
            $(this).dialog("close");
            settings["action_callback"]();
          }
        }
      }
      var $dialog = $selector.dialog({
        appendTo: $parent,
        autoOpen: false,
        resizable: false,
        height: "auto",
        draggable: false,
        width: width,
        modal: true,
        position: {my: "center", at: "center", of: $parent},
        classes: {"ui-dialog": style_class}, // this is for jquery 1.12 and after
        dialogClass: style_class, // this is for before jquery 1.12
        buttons: buttons
      });
      return $dialog;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Constructor
    //
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Register to window
  //
  if (window.edaplotjs) {
    window.edaplotjs.Widgets = Widgets;
  } else {
    window.edaplotjs = {};
    window.edaplotjs.Widgets = Widgets;
  }
})();
