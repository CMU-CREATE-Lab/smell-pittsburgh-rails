class SmellReportTracker < ActiveRecord::Base


  def self.is_listening_for_smell_reports?
    if Rails.cache.read("listening_for_smell_reports").nil?
      Rails.cache.write("listening_for_smell_reports", true)
    end
    return Rails.cache.read("listening_for_smell_reports")
  end


  def self.listening_for_smell_reports(flag)
    Rails.cache.write("listening_for_smell_reports", flag)
  end


  def self.get_last_reported
    return Rails.cache.read("last_smell_report_tracker_summary")
  end


  def self.set_last_reported(time_in_seconds)
    Rails.cache.write("last_smell_report_tracker_summary", time_in_seconds)
  end

end
