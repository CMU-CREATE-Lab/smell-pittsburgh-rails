class BASmellReportTracker < ActiveRecord::Base

  # listening_for_ba_smell_reports: (boolean) indicates the state of listening for smell reports for immediate callback (push notification)
  # generating_hourly_summary_for_ba_smell_reports: (boolean) indicates that we are waiting to calculate an hourly summary (since the last smell report that was handled in "listening_for_ba_smell_reports")
  # last_ba_smell_report_tracker_summary: (integer) the timestamp of the last smell report


  def self.is_listening_for_smell_reports?
    if Rails.cache.read("listening_for_ba_smell_reports").nil?
      # depending on the hour of the day, we should either be listening or not listening by default
      #convert to Pacific Time (accounts for DST)
      hour = ApplicationHelper.get_time_by_alias("BA")
      is_listening = (hour >= 7 and hour < 14)
      Rails.cache.write("listening_for_ba_smell_reports", is_listening)
    end
    return Rails.cache.read("listening_for_ba_smell_reports")
  end


  def self.listening_for_smell_reports(flag)
    Rails.cache.write("listening_for_ba_smell_reports", flag)
  end


  def self.is_generating_hourly_summary?
    if Rails.cache.read("generating_hourly_summary_for_ba_smell_reports").nil?
      Rails.cache.write("generating_hourly_summary_for_ba_smell_reports", false)
    end
    return Rails.cache.read("generating_hourly_summary_for_ba_smell_reports")
  end


  def self.generating_hourly_summary(flag)
    Rails.cache.write("generating_hourly_summary_for_ba_smell_reports", flag)
  end


  def self.get_last_reported
    return Rails.cache.read("last_ba_smell_report_tracker_summary")
  end


  def self.set_last_reported(time_in_seconds)
    Rails.cache.write("last_ba_smell_report_tracker_summary", time_in_seconds)
  end

end
