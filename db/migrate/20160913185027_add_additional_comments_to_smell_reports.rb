class AddAdditionalCommentsToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :additional_comments, :text
  end
end
