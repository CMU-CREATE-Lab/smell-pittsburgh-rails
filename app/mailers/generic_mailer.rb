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
    @name = form.name.blank? ? client.name + " User" : form.name
    @address = form.address
    @client = client
    mail(:to => to_address,:subject => "Smell Report")
  end
end
