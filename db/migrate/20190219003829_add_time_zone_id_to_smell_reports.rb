class AddTimeZoneIdToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :time_zone_id, :integer, index: true
  end
end
