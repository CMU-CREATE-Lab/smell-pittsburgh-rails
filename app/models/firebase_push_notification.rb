class FirebasePushNotification < ActiveRecord::Base

	# for some reason, Firebase API insists on prepending "/topics/" despite not using this when subscribing.
	# This prefix can also be used as a quick way to construct topics for non-production notifications
	def self.TOPIC_PREFIX
		"/topics/"
	end

	def self.GLOBAL_TOPIC
		"GlobalTopic"
	end

	def self.FIREBASE_URL
		"https://fcm.googleapis.com/fcm/send"
	end


	# pushes to those subscribed to Pittsburgh AQI notifications
	def self.push_aqi_pittsburgh(aqi_has_increased,cities,pittsburgh)
		pittsburgh_current_category = AqiTracker.category_for_aqi(AqiTracker.get_current_aqi(pittsburgh))["name"]
		pittsburgh_previous_category = AqiTracker.category_for_aqi(AqiTracker.get_previous_aqi(pittsburgh))["name"]

		if aqi_has_increased
			if cities.empty?
				body = "Pittsburgh AQI has increased from #{pittsburgh_previous_category} to #{pittsburgh_current_category}!"
			else
				random_city = cities.shuffle.first
				random_city_name = random_city["name"]
				random_city_aqi = AqiTracker.get_current_aqi(pittsburgh)
				pittsburgh_aqi = AqiTracker.get_current_aqi(pittsburgh)
				body = "Pittsburgh AQI is #{pittsburgh_aqi} (#{pittsburgh_current_category}) while #{random_city_name} is enjoying cleaner air (AQI #{random_city_aqi})"
			end
		else
			body = "Pittsburgh AQI has decreased from #{pittsburgh_previous_category} to #{pittsburgh_current_category}!"
		end

		title = "Pittsburgh AQI is #{pittsburgh_current_category}"
		topic = self.TOPIC_PREFIX+"pghaqi"
		self.send_push_notification(topic,title,body)
	end


	# pushes to those subscribed to smell reports on the same level as smell_report
	def self.push_smell_report(smell_report)
		topic = self.TOPIC_PREFIX+"SmellReports"
		title = "New Smell Report"
		body = "A smell report rated #{smell_report.smell_value} was just submitted! How does your air smell?"
		self.send_push_notification(topic,title,body)
	end


	# all Smell PGH clients should be subscribed to these messages
	def self.push_global(title, body)
		self.send_push_notification(self.TOPIC_PREFIX+self.GLOBAL_TOPIC, title, body)
	end


	def self.push_to_token(token, title, body)
		self.send_push_notification(token, title, body)
	end


	private


	# TODO add options
	def self.send_push_notification(to, title, body, options=nil)
		json = {}
		json["to"] = to
		json["notification"] = {
			"sound" => "default",
			"click_action" => "FCM_PLUGIN_ACTIVITY",
			"icon" => "fcm_push_icon"
		}
		json["notification"]["title"] = title
		json["notification"]["body"] = body

		# TODO add data
		json["data"] = {}

		# this is important so that devices get message in notification tray from background
		json["priority"] = "high"

		# HTTP request and response handler
		request = "POST"
		headers = '-H "Content-Type:application/json" -H "Authorization:key=' + FIREBASE_AUTH_KEY + '"'
		url = self.FIREBASE_URL
		data = json.to_json

		# only push on production
		if Rails.env == "production"
			response = `curl -X POST #{headers} #{url} -d '#{data}'`
			begin
				json_response = JSON.parse(response)
				unless json_response["message_id"].blank?
					Rails.logger.info("Successfully sent push with id=#{json_response["message_id"]}")
					return
				end
			end
		else
			Rails.logger.info("FirebasePushNotification (non-production): curl -X POST #{headers} #{url} -d '#{data}'")
		end
	end

end
