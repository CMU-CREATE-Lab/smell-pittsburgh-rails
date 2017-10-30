class PopulateObservedAtEpochForSmellReports < ActiveRecord::Migration


  def up
    SmellReport.all.each do |report|
      report.observed_at_epoch = report.observed_at.to_i
      report.save!
    end
  end


  def down
    SmellReport.all.each do |report|
      report.observed_at_epoch = report.observed_at.to_i
      report.save!
    end
  end

end
