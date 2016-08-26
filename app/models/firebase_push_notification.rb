class FirebasePushNotification < ActiveRecord::Base


	def self.GLOBAL_TOPIC
		"/topics/GlobalTopic"
	end

	def self.FIREBASE_URL
		"https://fcm.googleapis.com/fcm/send"
	end


	# TODO channel for: (1) general PGH aqi, (2) city comparison (multiple?)


	def self.push_smell_report_to_topic(smell_report,topic)
		title = "New Smell Report"
		body = "A user has submitted a smell report (level #{smell_report.smell_value} of 5)."
		self.push_topic(topic,title,body)
	end


	# TODO add options
	def self.push_global(title, body, options=nil)
		self.send_push_notification(self.GLOBAL_TOPIC, title, body, options)
	end


	# TODO add options
	def self.push_topic(topic, title, body, options=nil)
		self.send_push_notification(topic, title, body, options)
	end


	# TODO add options
	private
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
