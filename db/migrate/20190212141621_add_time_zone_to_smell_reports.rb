class AddTimeZoneToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :timezone, :string
  end
end
