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
      FirebasePushNotification.send_push_notification(args.to, args.title, args.body, {"log_tag": log_tag})
    end
  end

end
