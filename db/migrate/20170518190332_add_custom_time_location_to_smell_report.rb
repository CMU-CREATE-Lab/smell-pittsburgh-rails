class AddCustomTimeLocationToSmellReport < ActiveRecord::Migration
  def change
    add_column :smell_reports, :observed_at, :datetime
    add_column :smell_reports, :custom_time, :boolean, :default => false
    add_column :smell_reports, :custom_location, :boolean, :default => false
  end
end
