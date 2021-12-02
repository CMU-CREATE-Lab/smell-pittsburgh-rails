require 'csv'

namespace :smell_report do

  task :filter_for_swear_words => :environment do
    SmellReport.all.each do |report|
      report.filter_fields_for_swear_words
      report.save!
    end
  end


  task :add_zip_codes => :environment do
    SmellReport.all.each do |report|
      # request reverse geocode object
      if report.real_latitude and report.real_longitude and !report.zip_code_id
        geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{report.real_latitude}, #{report.real_longitude}" )
        # associate smell report with zip code
        unless geo.zip.blank?
          zip_code = ZipCode.find_or_create_by(zip: geo.zip)
          report.zip_code_id = zip_code.id
          report.save!
        end
        sleep(1)
      end
    end
  end


  task :populate_observed_at_fields => :environment do
    SmellReport.all.each do |report|
      unless report.custom_time
        report.observed_at = report.created_at
        report.save!
      end
    end
  end


  task :perturb_coordinates => :environment do
    SmellReport.all.each do |report|
      report.generate_perturbed_coordinates
      report.save!
    end
  end


  task :summary_notifications => :environment do
    ["PGH","BA"].each do |area|
      if area == "PGH"
        right_now = DateTime.now
        report_tracker = SmellReportTracker
        in_area_bounds = :in_pittsburgh
      elsif area == "BA"
        right_now = (DateTime.now.to_time - 3.hours).to_datetime
        report_tracker = BASmellReportTracker
        in_area_bounds = :in_bay_area
      end

      # start listening for smell reports at 7am
      if [7].include?(right_now.hour)
        report_tracker.listening_for_smell_reports(true)
      end

      # stop listening for smell reports at 2pm
      if [14].include?(right_now.hour)
        report_tracker.listening_for_smell_reports(false)
      end

      # give the daily summary at 7pm (and clear the last reported timestamp so we don't give an hourly summary afterwards)
      if [19].include?(right_now.hour)
        smell_reports = SmellReport.where(:created_at => DateTime.now.beginning_of_day..DateTime.now).from_app(area).send(in_area_bounds)
        # send the daily notification (even if no smell reports that day)
        FirebasePushNotification.push_smell_report_daily_summary(smell_reports, area)
        report_tracker.listening_for_smell_reports(false)
        report_tracker.set_last_reported(0)
        report_tracker.generating_hourly_summary(false)
      end

      # give the hourly summary after at least 1 hour has passed since the last smell report
      if report_tracker.is_generating_hourly_summary?
        from_time = report_tracker.get_last_reported
        # check time to perform summary
        if from_time > 0 and (right_now.to_i - from_time) >= 3600
          # if it has been more than 2 hours, then something went wrong with our logic (so we ignore and reset)
          if (right_now.to_i - from_time) <= 7200
            report_tracker.set_last_reported(0)
            report_tracker.generating_hourly_summary(false)
          else
            smell_reports = SmellReport.where("smell_value >= 3").where(:created_at => [Time.at(from_time).to_datetime..right_now]).from_app(area).send(in_area_bounds)
            FirebasePushNotification.push_smell_report_hourly_summary(smell_reports) unless smell_reports.empty?
            report_tracker.set_last_reported(0)
          end
        end
      end
    end
  end


  task :generate_achd_summary_csv => :environment do
    # reports from the last 7 days
    time_begin = 7.months.ago.midnight
    time_end = Time.now.midnight
    zipcodes = AchdForm.allegheny_county_zipcodes.map{ |z| ZipCode.find_or_create_by(zip: z) }
    rows = []

    row = [ "observed at", "smell value", "smell description", "street name", "zipcode", "additional comments" ]
    rows.push(row.to_csv)

    tmp = []
    zipcodes.each do |zipcode|
      zipcode.smell_reports.where(:observed_at => time_begin..time_end, :submit_achd_form => true).each do |report|
        row = [ report.observed_at, report.smell_value, report.smell_description, report.street_name, zipcode.zip, report.additional_comments ]
        tmp.push(row)
      end
    end
    tmp.sort_by!{|x| x[0]}
    tmp.each do |row|
      rows.push(row.to_csv)
    end

    puts rows
  end

  task :email_end_of_day_csv_report => :environment do
    ["PGH"].each do |area|
      if area == "PGH"
        Time.zone = "America/New_York"
        client = {"name" => "Smell PGH", "website" => "https://smellpgh.org"}
        agency_name = "Allegheny County Health Department"
        in_area_bounds = :in_pittsburgh
        email_recipients = ACHD_BULK_EMAIL_RECIPIENTS.join(",")
      end

      smell_reports = SmellReport.where(:created_at => DateTime.now.beginning_of_day..DateTime.now.end_of_day).from_app(area).send(in_area_bounds)

      csv_rows = []
      csv_rows.push ["epoch time","date & time","anonymized user hash","smell value","latitude","longitude","zipcode","street name","smell description","symptoms","additional comments"].to_csv
      smell_reports.each do |report|
        csv_rows.push [report.observed_at,Time.zone.at(report.observed_at).to_datetime.strftime("%m/%d/%Y %H:%M:%S %Z"),report.anonymized_user_hash,report.smell_value,report.real_latitude,report.real_longitude,report.zip_code.zip,report.street_name,report.smell_description,report.feelings_symptoms,report.additional_comments].to_csv
      end

      root_tmp_path = "#{Rails.root}/tmp/reports"
      report_name = "#{Date.today.to_s.gsub("-","")}_#{area.downcase}_smell_reports.csv"
      full_report_path = "#{root_tmp_path}/#{report_name}"
      subject = "Daily smell reports for #{area}"

      if Dir.exist?(root_tmp_path)
        # Clear out tmp report directory
        FileUtils.rm_f(Dir.glob("#{root_tmp_path}/*"))
      else
        # Create tmp report directory
        FileUtils.mkdir_p(root_tmp_path)
      end

      File.open("#{full_report_path}", 'w') { |file| file.write(csv_rows.join("")) }

      GenericMailer.email_with_daily_csv_report(email_recipients, subject, client, agency_name, full_report_path).deliver
    end
  end

end
