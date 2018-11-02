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
      var has_action_callback = (typeof settings["action_callback"] === "function");
      var action_text = safeGet(settings["action_text"], "Confirm");

      // Create a button for cancellation
      // The default text for the button is "Cancel" when there is an action button
      // The default text for the button is "Ok" when there is no action button
      var has_cancel_callback = (typeof settings["cancel_callback"] === "function");
      var cancel_text = has_action_callback ? "Cancel" : "Ok";
      cancel_text = safeGet(settings["cancel_text"], cancel_text);

      // Hide the cancel button or not
      var show_cancel_btn = safeGet(settings["show_cancel_btn"], true);

      // Specify the style
      var style_class = "custom-dialog-flat";

      // Specify the selector of the dialog
      // If no selector, a <div></div> will be created
      var $selector = $(safeGet(settings["selector"], "<div></div>"));

      // Specify the width of the dialog
      var width = safeGet(settings["width"], 260);

      // Specify buttons
      var buttons = {};
      if (show_cancel_btn) {
        buttons["Cancel"] = {
          class: "ui-cancel-button",
          text: cancel_text,
          click: function () {
            $(this).dialog("close");
            if (has_cancel_callback) settings["cancel_callback"]();
          }
        }
      }
      if (has_action_callback) {
        buttons["Action"] = {
          class: "ui-action-button",
          text: action_text,
          click: function () {
            $(this).dialog("close");
            settings["action_callback"]();
          }
        }
      }

      // Create dialog
      var dialog_settings = {
        autoOpen: false,
        resizable: false,
        height: "auto",
        draggable: false,
        width: width,
        modal: true,
        classes: {"ui-dialog": style_class}, // this is for jquery 1.12 and after
        dialogClass: style_class, // this is for before jquery 1.12
        buttons: buttons,
        closeText: '×'
      };
      // Specify the parent of the dialog, need to be a jQuery object
      if (typeof settings["parent"] !== "undefined") {
        dialog_settings["appendTo"] = settings["parent"];
        dialog_settings["position"] = {my: "center", at: "center", of: settings["parent"]};
      }
      var $dialog = $selector.dialog(dialog_settings);
      return $dialog;
    };
    this.createCustomDialog = createCustomDialog;

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
