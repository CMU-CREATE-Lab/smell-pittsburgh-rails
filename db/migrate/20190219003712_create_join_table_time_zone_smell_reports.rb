class CreateJoinTableTimeZoneSmellReports < ActiveRecord::Migration
  def change
    create_join_table :time_zones, :smell_reports
  end
end
