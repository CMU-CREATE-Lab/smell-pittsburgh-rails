class AchdMailer < ApplicationMailer

  default :from => "smellpgh-reports@createlab.org",
          :to => ACHD_EMAIL_RECIPIENT,
          :content_type => "text/plain"


  def email(achd_form)
    @smell_report = achd_form.smell_report
    @geocode = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{@smell_report.real_latitude}, #{@smell_report.real_longitude}" )
    @reply_to = achd_form.email.blank? ? achd_form.formatted_server_email : achd_form.email
    @phone_number = achd_form.phone
    @name = achd_form.name.blank? ? "CREATE Lab" : achd_form.name
    @address = achd_form.address

    mail(:subject => "Smell Report", :reply_to => @reply_to)
  end

end
