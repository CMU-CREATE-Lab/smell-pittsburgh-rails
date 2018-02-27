class AddDebugInfoToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :debug_info, :text
  end
end
