class FirebasePushNotification < ActiveRecord::Base

  # for some reason, Firebase API insists on prepending "/topics/" despite not using this when subscribing.
  # This prefix can also be used as a quick way to construct topics for non-production notifications
  def self.TOPIC_PREFIX
    "/topics/"
  end

  def self.GLOBAL_TOPIC
    "GlobalTopic"
  end

  def self.SMC_REMINDER_TOPIC
    "ReminderNotification"
  end

  def self.FIREBASE_URL
    "https://fcm.googleapis.com/fcm/send"
  end


  # pushes to those subscribed to Pittsburgh AQI notifications
  # aqi_has_increased: true indicates increase, false indicates decrease (if neither increase/decrease, the function should not be called)
  def self.push_aqi_pittsburgh_change(aqi_has_increased,cities,pittsburgh)
    topic = self.TOPIC_PREFIX+"pghaqi"
    title = ""
    body = ""

    if aqi_has_increased
      title = "Is there a malodor outside?"
      body = "PGH pollution levels just went up"
    else
      title = "Does it smell better?"
      body = "Pittsburgh AQI just improved"
    end

    self.send_push_notification(topic,title,body)
  end


  def self.push_aqi_pittsburgh_green
    topic = self.TOPIC_PREFIX+"pghaqi"
    title = "Does it smell better?"
    body = "Pittsburgh AQI just improved"

    self.send_push_notification(topic,title,body, {"analytics_category" => "push_notification_aqi_improved"})
  end


  def self.push_aqi_pittsburgh_notgood
    topic = self.TOPIC_PREFIX+"pghaqi"
    title = "PGH Air Quality Notification"
    body = "AQI has been over 50 for last 2 hrs"

    self.send_push_notification(topic,title,body, {"analytics_category" => "push_notification_aqi_worse"})
  end


  # pushes to those subscribed to smell reports on the same level as smell_report
  def self.push_smell_report(smell_report, area=nil)
    topic = self.getTopicFromArea(area)

    title = "How does your air smell?"
    body = "A smell report rated #{smell_report.smell_value} was just submitted"

    self.send_push_notification(topic,title,body,{"area"=>area})
  end


  # list: list of smell reports
  def self.push_smell_report_daily_summary(list, area=nil)
    topic = self.getTopicFromArea(area)

    title = "Smell Report Summary"
    body = "#{list.size}"
    if list.size == 1
      body += " smell report was submitted today"
    else
      body += " smell reports were submitted today"
    end

    self.send_push_notification(topic,title,body,{"area"=>area})
  end


  def self.push_smell_report_hourly_summary(list, area=nil)
    topic = self.getTopicFromArea(area)

    # title depends on how many reports we have
    title = list.size >= 15 ? "Did you submit a report?" : "View map of smell reports"
    body = "#{list.size}"
    if list.size == 1
      body += " odor was reported in the last 2 hours"
    else
      body += " odors were reported in the last 2 hours"
    end

    self.send_push_notification(topic,title,body,{"area"=>area})
  end


  # all Smell PGH clients should be subscribed to these messages
  def self.push_global(title, body, area=nil)
    if area.blank?
      topic = self.TOPIC_PREFIX+self.GLOBAL_TOPIC
    else
      # this is likely not even being used by BA
      topic = self.TOPIC_PREFIX+area+"-"+self.GLOBAL_TOPIC
    end
    self.send_push_notification(topic, title, body)
  end


  def self.push_to_token(token, title, body)
    self.send_push_notification(token, title, body)
  end


  def self.push_smc_reminder(title, body)
    topic = self.TOPIC_PREFIX+self.SMC_REMINDER_TOPIC
    self.send_smc_notification(topic, title, body)
  end


  private


  def self.send_push_notification(to, title, body, options={})
    # default to smell PGH
    self.send_notification(FIREBASE_AUTH_KEY, to, title, body, options)
  end


  def self.send_smellpgh_notification(to, title, body, options={})
    # default to smell PGH
    self.send_notification(FIREBASE_AUTH_KEY, to, title, body, options)
  end


  def self.send_smc_notification(to, title, body, options={})
    # default to smell PGH
    self.send_notification(SMC_FIREBASE_AUTH_KEY, to, title, body, options)
  end


  # TODO add options
  def self.send_notification(project_auth, to, title, body, options)
    # prepend to topics if we are on staging
    if Rails.env == "staging"
      to = self.TOPIC_PREFIX + "STAGING-" + to.split(self.TOPIC_PREFIX).last if to.split(self.TOPIC_PREFIX).size > 1
      if not ["pghaqi","SmellReports","GlobalTopic"].index(to).nil?
        Rails.logger.info("ERROR: send_push_notification refusing to send notification to=#{to} since this is a topic on production.")
        return;
      end
    end

    if options["area"] == "BA"
      current_hour = (Time.now - 3 * 60 * 60).hour
    else
      current_hour = Time.now.hour
    end

    Rails.logger.info("FirebasePushNotification(#{DateTime.now}): Sending notification to=#{to}, title=#{title}, body=#{body}")
    json = {}
    json["to"] = to
    json["notification"] = {
      "sound" => "default",
      "icon" => "fcm_push_icon"
    }
    json["time_to_live"] = 3600
    json["notification"]["title"] = title
    json["notification"]["body"] = body

    # TODO add more data
    json["data"] = {}
    # Used by cordova-plugin-firebasex to display a system notification upon receiving the notification messages while the app is running in the foreground.
    # If not set to true (default), it will NOT be displayed as a system notification. Instead the notification message payload will be passed to the
    # onMessageReceived callback for the plugin to handle.
    json["data"]["notification_foreground"] = "true"
    # used by cordova app to navigate user after clicking on notification
    json["data"]["open_with_page"] = options["open_with_page"].blank? ? "map" : options["open_with_page"]
    # used by cordova app to display a pop-up on first time explaining the prediction model
    if not options["notification_type"].blank?
      json["data"]["notification_type"] = options["notification_type"]
    end
    if not options["analytics_category"].blank?
      json["data"]["analytics_category"] = options["analytics_category"]
    end

    # this is important so that devices get message in notification tray from background
    json["priority"] = "high"

    # HTTP request and response handler
    request = "POST"
    headers = '-H "Content-Type:application/json" -H "Authorization:key=' + project_auth + '"'
    url = self.FIREBASE_URL
    data = json.to_json

    # only push on production
    if Rails.env == "production" or Rails.env == "staging"
      # do not send any notifications from 9 PM until 5 AM
      if current_hour.between?(21,24) or current_hour.between?(0,4)
        # TODO make this error message reflect when it's Pacific time
        Rails.logger.info("Refusing to send push notification at hour=#{current_hour}; info was: headers=#{headers}, url=#{url}, data=#{data}")
      else
        response = `curl -X POST #{headers} #{url} -d '#{data}'`
        # TODO this could be silently crashing on us
        begin
          json_response = JSON.parse(response)
          unless json_response["message_id"].blank?
            Rails.logger.info("Successfully sent push with id=#{json_response["message_id"]}")
            # only record in database if we have a log_tag
            tag = (not options["log_tag"].blank?) ? options["log_tag"] : ""
            Rails.logger.info("send_push_notification: tag=#{tag},time=#{DateTime.now.to_i},topic=#{to},title=#{title},body=#{body}") unless tag.blank?
            return
          end
        end
      end
    else
      Rails.logger.info("FirebasePushNotification (non-production): curl -X POST #{headers} #{url} -d '#{data}'")
    end
  end


  def self.getTopicFromArea(area)
    if not area.nil? and area != "PGH"
      topic = self.TOPIC_PREFIX+area+"SmellReports"
    else
      topic = self.TOPIC_PREFIX+"SmellReports"
    end
    return topic
  end

end
