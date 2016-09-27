namespace :smell_report do


  task :perturb_coordinates => :environment do
    SmellReport.all.each do |report|
      report.generate_perturbed_coordinates
      report.save!
    end
  end


  task :summary_notifications => :environment do
    to_time = Time.now.to_i

    # start listening for smell reports at 6am
    if [6].include?(to_time.hour)
      SmellReportTracker.listening_for_smell_reports(true)
    end

    # stop listening for smell reports at 2pm
    if [14].include?(to_time.hour)
      SmellReportTracker.listening_for_smell_reports(false)
    end

    # give the daily summary at 7pm (and clear the last reported timestamp so we don't give an hourly summary afterwards)
    if [19].include?(to_time.hour)
      smell_reports = SmellReport.where("smell_value >= 3").where(:created_at => DateTime.now.beginning_of_day..DateTime.now)
      # send the daily notification (even if no smell reports that day)
      FirebasePushNotification.push_smell_report_daily_summary(smell_reports)
      SmellReportTracker.listening_for_smell_reports(false)
      SmellReportTracker.set_last_reported(0)
      SmellReportTracker.generating_hourly_summary(false)
    end

    # give the hourly summary after at least 1 hour has passed since the last smell report
    if SmellReportTracker.is_generating_hourly_summary?
      from_time = SmellReportTracker.get_last_reported
      # check time to perform summary
      if from_time > 0 and (to_time - from_time) >= 3600
        # if it has been more than 2 hours, then something went wrong with our logic (so we ignore and reset)
        if (to_time - from_time) <= 7200
          SmellReportTracker.set_last_reported(0)
          SmellReportTracker.generating_hourly_summary(false)
        else
          smell_reports = SmellReport.where("smell_value >= 3").where(:created_at => [Time.at(from_time).to_datetime..Time.at(to_time).to_datetime])
          FirebasePushNotification.push_smell_report_hourly_summary(smell_reports) unless smell_reports.empty?
          SmellReportTracker.set_last_reported(0)
        end
      end
    end
  end

end
