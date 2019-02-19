class AddIndexToSmellReportTimeZoneId < ActiveRecord::Migration
  def change
    add_index :smell_reports, :time_zone_id
  end
end
