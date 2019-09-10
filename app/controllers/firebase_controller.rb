class FirebaseController < ApplicationController


  def test
    render :json => "test"
  end


  def send_notification
    # NOTE: assumes SMC
    topic = params["topic"]
    msg_title = params["title"]
    msg_body = params["body"]

    if topic.blank? or msg_title.blank? or msg_body.blank?
      response = { :error => "bad format" }
    else
      FirebasePushNotification.send_smc_notification(topic, msg_title, msg_body)
      response = "OK"
    end

    render :json => response
  end

end
