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
	# aqi_has_increased: true indicates increase, false indicates decrease (if neither increase/decrease, the function should not be called)
	def self.push_aqi_pittsburgh(aqi_has_increased,cities,pittsburgh)
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


	# pushes to those subscribed to smell reports on the same level as smell_report
	def self.push_smell_report(smell_report)
		topic = self.TOPIC_PREFIX+"SmellReports"

		title = "How does your air smell?"
		body = "A smell report rated #{smell_report.smell_value} was just submitted"

		self.send_push_notification(topic,title,body)
	end


	# list: list of smell reports
	def self.push_smell_report_daily_summary(list)
		topic = self.TOPIC_PREFIX+"SmellReports"

		title = "Smell Report Summary"
		body = "#{list.size}"
		if list.size == 1
			body += " smell report was submitted today"
		else
			body += " smell reports were submitted today"
		end

		self.send_push_notification(topic,title,body)
	end


	def self.push_smell_report_hourly_summary(list)
		topic = self.TOPIC_PREFIX+"SmellReports"

		# title depends on how many reports we have
		title = list.size >= 15 ? "Did you submit a report?" : "View map of smell reports"
		body = "#{list.size}"
		if list.size == 1
			body += " odor was reported in the last 2 hours"
		else
			body += " odors were reported in the last 2 hours"
		end

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
