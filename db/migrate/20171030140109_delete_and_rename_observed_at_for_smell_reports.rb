class DeleteAndRenameObservedAtForSmellReports < ActiveRecord::Migration
  def change
    remove_column :smell_reports, :observed_at
    rename_column :smell_reports, :observed_at_epoch, :observed_at
  end
end
