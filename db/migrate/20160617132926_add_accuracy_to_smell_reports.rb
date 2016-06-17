class AddAccuracyToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :horizontal_accuracy, :float
    add_column :smell_reports, :vertical_accuracy, :float
  end
end
