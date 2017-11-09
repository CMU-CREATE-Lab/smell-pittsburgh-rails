class PopulateObservedAtEpochForSmellReports < ActiveRecord::Migration


  def up
    SmellReport.reset_column_information
    SmellReport.all.each do |report|
      if report.observed_at.to_i > 0
        report.observed_at_epoch = report.observed_at.to_i
      else
        report.observed_at_epoch = report.created_at.to_i
      end
      report.save!
    end
  end


  def down
    SmellReport.reset_column_information
    SmellReport.all.each do |report|
      report.observed_at = Time.at(report.observed_at_epoch)
      report.save!
    end
  end

end
