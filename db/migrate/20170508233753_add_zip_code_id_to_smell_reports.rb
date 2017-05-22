class AddZipCodeIdToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :zip_code_id, :integer, index: true
  end
end
