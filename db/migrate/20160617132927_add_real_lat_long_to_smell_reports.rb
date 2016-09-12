class AddRealLatLongToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :real_latitude, :float
    add_column :smell_reports, :real_longitude, :float
  end
end
