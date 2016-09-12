namespace :smell_report do


  task :perturb_coordinates => :environment do
    SmellReport.all.each do |report|
      report.generate_perturbed_coordinates
      report.save!
    end
  end

end
