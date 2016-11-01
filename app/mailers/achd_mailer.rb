class AchdMailer < ApplicationMailer

  default :from => "smellpgh-reports@createlab.org",
          :to => ACHD_EMAIL_RECIPIENT,
          :content_type => "text/plain"


  # ASSERT: zipcode is not blank and is a zipcode in Allegheny County
  def email(achd_form,street_address=nil,zipcode)
    @smell_report = achd_form.smell_report
    @street_address = street_address
    @zipcode = zipcode
    @reply_to = achd_form.email.blank? ? achd_form.formatted_server_email : achd_form.email
    @phone_number = achd_form.phone
    @name = achd_form.name.blank? ? "Smell PGH App User" : achd_form.name
    @address = achd_form.address

    mail(:subject => "Smell Report", :reply_to => @reply_to)
  end

end
