require 'openssl'
require 'base64'
require 'date'


# Todo: Implement multi-topic notifications (i.e. PGH + RMD for pittsbugh and reminder notifications)
# Currently uses pghaqi for backcompatability for Pittsburgh, consider keeping backcompatability for some time?
class FirebasePushNotification < ActiveRecord::Base

  # for some reason, Firebase API insists on prepending "/topics/" despite not using this when subscribing.
  # This prefix can also be used as a quick way to construct topics for non-production notifications
  # NO LONGER NEEDED AS WE DO 'topic' in topics 
  # def self.TOPIC_PREFIX
  #   "/topics/"
  # end

  def self.GLOBAL_TOPIC
    "GlobalTopic"
  end

  def self.SMC_REMINDER_TOPIC
    # "ReminderNotification"
    "RMD"
  end

  def self.TOKEN_URL
    "https://oauth2.googleapis.com/token"
  end

  # Identifier for service account for project
  # (It's the phrase between @ and .com in the email)
  #i.e. smell-my-citya12345
  def self.SMC_SERVICE_ACCOUNT
    "DO NOT PUSH"
  end
  
  # Name of service account for project
  # (It's the phrase before @ in the the email)
  #i.e. smell-my-city-account
  def self.SMC_SERVICE_ACCOUNT_NAME
    "DO NOT PUSH"
  end

  # Note SMC key.json should be named "smc_service_account.json"
  def self.SMC_SERVICE_ACCOUNT_PRIVATE_KEY
    "#{Dir.pwd}/config/smc_service_account.json"
  end  

  def self.SMC_FIREBASE_ACCESS_TOKEN
    "#{Dir.pwd}/config/smc_access_token.txt"
  end
   
  # Identifier for service account for project
  # (It's the phrase between @ and .com in the email)
  #i.e. smell-my-citya12345   
  def self.PGH_SERVICE_ACCOUNT
    "DO NOT PUSH"
  end

  # Name of service account for project
  # (It's the phrase before @ in the the email)
  #i.e. smell-my-city-account
  def self.PGH_SERVICE_ACCOUNT_NAME
    "DO NOT PUSH" 
  end

  # Note SMC key.json should be named "pgh_service_account.pem"
  def self.PGH_SERVICE_ACCOUNT_PRIVATE_KEY
    "#{Dir.pwd}/config/pgh_service_account.json"
  end  

  def self.PGH_FIREBASE_ACCESS_TOKEN
    "#{Dir.pwd}/config/pgh_access_token.txt"
  end    

  def self.getFirebaseNotificationURL(service_account)
    "https://fcm.googleapis.com/v1/projects/#{service_account}/messages:send"
  end


  def self.getServiceAccountEmail(account_name,service_account)
    "#{account_name}@#{service_account}.iam.gserviceaccount.com"
  end 

  # pushes to those subscribed to Pittsburgh AQI notifications
  # aqi_has_increased: true indicates increase, false indicates decrease (if neither increase/decrease, the function should not be called)
  def self.push_aqi_pittsburgh_change(aqi_has_increased,cities,pittsburgh)
    # topic = ["pghaqi"]
    topic = []
    topic.push(City.find_by_name("Pittsburgh").hashed)
    topic.push("AQI")
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
    # topic = ["pghaqi"]
    topic = []
    topic.push(City.find_by_name("Pittsburgh").hashed)
    topic.push("AQI")
    title = "Does it smell better?"
    body = "Pittsburgh AQI just improved"

    self.send_push_notification(topic,title,body, {"analytics_category" => "push_notification_aqi_improved"})
  end


  def self.push_aqi_pittsburgh_notgood
    # topic = ["pghaqi"]
    topic = []
    topic.push(City.find_by_name("Pittsburgh").hashed)
    topic.push("AQI")
    title = "PGH Air Quality Notification"
    body = "AQI has been over 50 for last 2 hrs"

    self.send_push_notification(topic,title,body, {"analytics_category" => "push_notification_aqi_worse"})
  end

  # Todo: Fix Function after 5/3 conversation
  # pushes to those subscribed to smell reports on the same level as smell_report
  def self.push_smell_report(smell_report, area=nil)
    topic = [self.getTopicFromArea(area)]

    title = "How does your air smell?"
    body = "A smell report rated #{smell_report.smell_value} was just submitted"

    self.send_push_notification(topic,title,body,{"area"=>area})
  end

  # Todo: Fix Function after 5/3 conversation
  # list: list of smell reports
  def self.push_smell_report_daily_summary(list, area=nil)
    topic = [self.getTopicFromArea(area)]

    title = "Smell Report Summary"
    body = "#{list.size}"
    if list.size == 1
      body += " smell report was submitted today"
    else
      body += " smell reports were submitted today"
    end

    self.send_push_notification(topic,title,body,{"area"=>area})
  end

  # Todo: Fix Function after 5/3 conversation
  def self.push_smell_report_hourly_summary(list, area=nil)
    topic = [self.getTopicFromArea(area)]

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
      topic = [self.GLOBAL_TOPIC]
    else
      # this is likely not even being used by BA
      topic = [area+"-"+self.GLOBAL_TOPIC]
    end
    self.send_push_notification(topic, title, body)
  end


  def self.push_to_token(token, title, body)
    self.send_push_notification(token, title, body)
  end


  def self.push_smc_reminder(title, body)
    topic = [self.SMC_REMINDER_TOPIC]
    self.send_smc_notification(topic, title, body)
  end


  private


  def self.send_push_notification(conditions, title, body, options={})
    # default to smell PGH
    self.send_notification(self.PGH_SERVICE_ACCOUNT_NAME,self.PGH_SERVICE_ACCOUNT, self.PGH_SERVICE_ACCOUNT_PRIVATE_KEY, self.PGH_FIREBASE_ACCESS_TOKEN, conditions, title, body, options)
  end


  def self.send_smellpgh_notification(conditions, title, body, options={})
    # default to smell PGH
    self.send_notification(self.PGH_SERVICE_ACCOUNT_NAME,self.PGH_SERVICE_ACCOUNT, self.PGH_SERVICE_ACCOUNT_PRIVATE_KEY, self.PGH_FIREBASE_ACCESS_TOKEN, conditions, title, body, options)
  end


  def self.send_smc_notification(conditions, title, body, options={})
    # default to smell PGH
    self.send_notification(self.SMC_SERVICE_ACCOUNT_NAME,self.SMC_SERVICE_ACCOUNT, self.SMC_SERVICE_ACCOUNT_PRIVATE_KEY, self.SMC_FIREBASE_ACCESS_TOKEN, conditions, title, body, options)
  end

  def self.send_notification(accountName,serviceAccount,privateKeyLoc, accessTokenLoc,conditions, title, body, options)
    # prepend to topics if we are on staging
    if Rails.env == "staging"
      conditions.map!{|s| "STAGING-#{s}"}
      if conditions.any? {|s| ["pghaqi","SmellReports","GlobalTopic"].any? {|t| s.include?(t)}}
        Rails.logger.info("ERROR: send_push_notification refusing to send notification to=#{to} since this is a topic on production.")
        return;
      end
    end

    current_hour = ApplicationHelper.get_time_by_alias(options["area"])

    Rails.logger.info("FirebasePushNotification(#{DateTime.now}): Sending notification with conditions: condition=#{conditions}, title=#{title}, body=#{body}")
    json = {}
    
    json["message"] = {}
    json["message"]["android"] = {}
    json["message"]["notification"] = {}
    json["message"]["android"]["notification"] = {
      "sound" => "default",
      "icon" => "fcm_push_icon"
    }
    json["message"]["android"]["ttl"] = "3600s"
    json["message"]["notification"]["title"] = title
    json["message"]["notification"]["body"] = body

    # TODO add more data
    json["message"]["data"] = {}
    # Used by cordova-plugin-firebasex to display a system notification upon receiving the notification messages while the app is running in the foreground.
    # If not set to true (default), it will NOT be displayed as a system notification. Instead the notification message payload will be passed to the
    # onMessageReceived callback for the plugin to handle.
    json["message"]["data"]["notification_foreground"] = "true"
    # used by cordova app to navigate user after clicking on notification
    json["message"]["data"]["open_with_page"] = options["open_with_page"].blank? ? "map" : options["open_with_page"]
    # used by cordova app to display a pop-up on first time explaining the prediction model
    if not options["notification_type"].blank?
      json["message"]["data"]["notification_type"] = options["notification_type"]
    end
    if not options["analytics_category"].blank?
      json["message"]["data"]["analytics_category"] = options["analytics_category"]
    end

    # this is important so that devices get message in notification tray from background
    json["message"]["android"]["priority"] = "high"

    json["message"]["condition"] = self.conditionsToString(conditions)

    data = json.to_json

    # only push on production
    if true
    # if Rails.env == "production" or Rails.env == "staging"
      # do not send any notifications from 9 PM until 5 AM
      if current_hour.between?(21,24) or current_hour.between?(0,4)
        # TODO make this error message reflect when it's Pacific time
        headers = '-H "Content-Type:application/json" -H "Authorization: Bearer ' + File.read(accessTokenLoc) + '"'
        url = self.getFirebaseNotificationURL(serviceAccount)
        Rails.logger.info("Refusing to send push notification at hour=#{current_hour}; info was: headers=#{headers}, url=#{url}, data=#{data}")
      else

        # Windows cURL compatability
        data = data.gsub('"','\"')
        self.trySendNotification(accountName,serviceAccount,privateKeyLoc,accessTokenLoc,data,conditions,options,false)
      end
    else
      Rails.logger.info("FirebasePushNotification (non-production): curl -X POST #{headers} #{url} -d '#{data}'")
    end
  end

  # Attempts to send notification, refreshes access token if the attempt fails
  def self.trySendNotification(accountName,serviceAccount,privateKeyLoc,accessTokenLoc,data,conditions,options,refreshed)

    # Generate new access token if none exists
    unless File.exist?(accessTokenLoc)
      Rails.logger.info("No previous auth token exists, requesting new token at time=#{DateTime.now.to_i}")
      self.requestAccessToken(self.getServiceAccountEmail(accountName,serviceAccount),privateKeyLoc, accessTokenLoc)
    end  
    headers = '-H "Content-Type:application/json" -H "Authorization: Bearer ' + File.read(accessTokenLoc) + '"'
    url = self.getFirebaseNotificationURL(serviceAccount)

    # Make request to Google endpoint
    # Changed to "" for Windows cURL compatability
    response = `curl -X POST #{headers} #{url} -d "#{data}"`
    begin
      json_response = JSON.parse(response)
      unless json_response["name"].blank?
            Rails.logger.info("Successfully sent push with id=#{json_response["name"]}")

            # only record in database if we have a log_tag
            tag = (not options["log_tag"].blank?) ? options["log_tag"] : ""
            Rails.logger.info("send_push_notification: tag=#{tag},time=#{DateTime.now.to_i},conditions=#{conditions},title=#{title},body=#{body}") unless tag.blank?
      else

        # Request failed try to get a new access token
        unless refreshed
          Rails.logger.info("Notification request failed, requesting new token at time=#{DateTime.now.to_i}")
          self.requestAccessToken(self.getServiceAccountEmail(accountName,serviceAccount),privateKeyLoc, accessTokenLoc)
          self.trySendNotification(accountName,serviceAccount,privateKeyLoc, accessTokenLoc,data,conditions,options,true)
        end 
      end 
    end  
  end
   
  #Format for condition in request is "'topic1' in topics and 'topic2' in topics"
  def self.conditionsToString(conditions)
    conditions.map!{|s| "'#{s}' in topics"}
    return conditions.join(" and ")
  end
  
  # Todo: Fix Function after 5/3 conversation
  def self.getTopicFromArea(area)
    if not area.nil? and area != "PGH"
      topic = area+"SmellReports"
    else
      topic = "SmellReports"
    end
    return topic
  end


  # Get a new access token when the old one expires
  def self.requestAccessToken(serviceEmail,privateKeyLoc,accessTokenLoc)
    root = Dir.pwd

    # Service Account Secret Key (Don't push should be in .gitignore)
    key = OpenSSL::PKey::RSA.new(JSON.parse(File.read(privateKeyLoc))["private_key"])

    # Google only accepts this header
    head = {}
    head["alg"] = "RS256"
    head["typ"] = "JWT"
    header = Base64.urlsafe_encode64(head.to_json)

    claim = {}
    
    #Time of request
    claim["iat"] = DateTime.now.strftime('%s')
    
    #Time request expires   
    claim["exp"] = claim["iat"].to_i + 3600

    # Service Account email
    claim["iss"] = serviceEmail
    claim["scope"] = "https://www.googleapis.com/auth/cloud-platform"
    claim["aud"] = "https://oauth2.googleapis.com/token"


    # Google Token endpoint
    endpoint = self.TOKEN_URL
  
    data = Base64.urlsafe_encode64(claim.to_json)

    encHead = 
    encode64 = "#{header}.#{data}"
    
    #Signature from key
    digest = OpenSSL::Digest::SHA256.new
    signature = key.sign(digest,encode64)
    response = `curl -d "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=#{encode64}.#{Base64.urlsafe_encode64(signature)}" #{endpoint}`
    json_response = JSON.parse(response)

    unless json_response["access_token"].blank?
      Rails.logger.info("Obtained new access token: #{json_response["access_token"]}")
      File.write(accessTokenLoc, json_response["access_token"])
    else
      Rails.logger.info("Failed to obtain new access token")
    end

  end
end
