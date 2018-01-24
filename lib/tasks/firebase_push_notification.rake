namespace :firebase_push_notification do


  # call me: `rake firebase_push_notification:send["/topics/topicname","Push Title","Message","LogTag"] RAILS_ENV=development`
  # NOTE: do not add any spaces between parameters (otherwise wrap in quotes)
  task :send, [:to,:title,:body,:log_tag] => :environment do |t, args|
    if args.to.blank? or args.title.blank? or args.body.blank?
      puts "Incorrect format."
      exit 1
    else
      log_tag = args.log_tag.blank? ? "default_raketask" : args.log_tag
      # puts "CALL TO: send_push_notification(#{args.to}, #{args.title}, #{args.body}, {\"log_tag\": #{log_tag}})"
      FirebasePushNotification.send_push_notification(args.to, args.title, args.body, {"log_tag" => log_tag})
    end
  end


  task :send_prediction, [:to] => :environment do |t, args|
    Rails.logger.info("Called raketask firebase_push_notification:send_prediction")
    title = "Smell Event Alert"
    body = "Local weather and pollution data indicates there may be a Pittsburgh smell event in the next few hours. Keep a nose out and report smells you notice!"
    if args.to.blank?
      puts "Please specify the topic to sent the notification to."
      exit 1
    else
      FirebasePushNotification.send_push_notification(args.to, title, body, {"log_tag" => "smell_prediction", "notification_type" => "prediction", "open_with_page" => "home"})
    end
  end

end
