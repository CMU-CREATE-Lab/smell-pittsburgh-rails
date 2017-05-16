class AddIndexToSmellReportZipCodeId < ActiveRecord::Migration
  def change
    add_index :smell_reports, :zip_code_id
  end
end
