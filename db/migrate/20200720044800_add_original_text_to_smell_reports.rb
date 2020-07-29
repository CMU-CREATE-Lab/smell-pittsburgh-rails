class AddOriginalTextToSmellReports < ActiveRecord::Migration
  def change
  	add_column :smell_reports, :original_description, :text
  	add_column :smell_reports, :original_symptoms, :text
  	add_column :smell_reports, :original_comments, :text
  end
end
