class PopulateTimeZonesForSmellReports < ActiveRecord::Migration
  # Uses IANA timezones naming scheme
  def change
    # Pittsburgh
    pgh = City.find(1).zip_codes.map(&:smell_reports).flatten
    timezone = TimeZone.new
    timezone.time_zone = "America/New_York"
    timezone.save!
    pgh.each do |smell_report|
      smell_report.time_zone_id = timezone.id
      smell_report.save!
    end
    # Lousiville
    louisville = City.find(2).zip_codes.map(&:smell_reports).flatten
    timezone = TimeZone.new
    timezone.time_zone = "America/Kentucky/Louisville"
    timezone.save!
    louisville.each do |smell_report|
      smell_report.time_zone_id = timezone.id
      smell_report.save!
    end
  end
end
