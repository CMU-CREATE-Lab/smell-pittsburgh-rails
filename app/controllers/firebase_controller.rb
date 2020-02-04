class FirebaseController < ApplicationController


  def test
    render :json => "test"
  end


  def send_notification
    topic = params["topic"]
    msg_title = params["title"]
    msg_body = params["body"]
    app_type = params["app_type"]

    if topic.blank? or msg_title.blank? or msg_body.blank?
      response = { :error => "bad format" }
    else
      # If app type is blank, asssume smc. This is here for legacy reasons
      if app_type == "smc" || app_type == nil
        FirebasePushNotification.send_smc_notification(topic, msg_title, msg_body)
      elsif app_type == "smellpgh"
        FirebasePushNotification.send_smellpgh_notification(topic, msg_title, msg_body)
      end
      response = "OK"
    end

    render :json => response
  end

end
