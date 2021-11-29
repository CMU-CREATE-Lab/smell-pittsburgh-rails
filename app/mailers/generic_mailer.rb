class GenericMailer < ApplicationMailer

  default :from => "smellpgh-reports@cmucreatelab.org",
          :content_type => "text/plain"


  def email(form,street_address,zipcode,to_address,agency_name,client)
    @smell_report = form.smell_report
    @street_address = street_address
    @time_zone = @smell_report.time_zone ? @smell_report.time_zone.time_zone : "America/New_York"
    @time = Time.at(@smell_report.observed_at).in_time_zone(@time_zone)
    @zipcode = zipcode
    @phone_number = form.phone
    @reply_to = form.email
    @agency_name = agency_name
    @name = form.name.blank? ? client.name + " User (id: #{@smell_report.anonymized_user_hash})" : form.name
    @address = form.address
    @client = client
    @gmaps_link = "https://google.com/maps/search/" + @smell_report.real_latitude.to_s + "," + @smell_report.real_longitude.to_s
    mail(:to => to_address,:subject => "Smell Report")
  end

  def email_with_daily_csv_report(to, subject, client, agency_name, file_path)
    @client = client
    @agency_name = agency_name
    file_name = File.basename(file_path)
    attachments[file_name] = File.read(file_path)
    mail(:to => to, :subject => subject)
  end

end
