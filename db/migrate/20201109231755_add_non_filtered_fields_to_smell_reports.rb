class AddNonFilteredFieldsToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :real_smell_description, :text
    add_column :smell_reports, :real_feelings_symptoms, :text
    add_column :smell_reports, :real_additional_comments, :text
  end
end
