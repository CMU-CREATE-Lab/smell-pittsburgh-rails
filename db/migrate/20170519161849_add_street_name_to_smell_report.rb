class AddStreetNameToSmellReport < ActiveRecord::Migration
  def change
    add_column :smell_reports, :street_name, :string, :limit => 32
  end
end
