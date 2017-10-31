class AddObservedAtEpochToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :observed_at_epoch, :integer
  end
end
