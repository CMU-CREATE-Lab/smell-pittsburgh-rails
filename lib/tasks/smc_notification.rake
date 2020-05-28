namespace :smc_notification do


  task :send_reminder, [:title,:body] => :environment do |t, args|
    if args.title.blank? or args.body.blank?
      puts "Incorrect format."
      exit 1
    else
      FirebasePushNotification.push_smc_reminder(args.title, args.body)
    end
  end

end
