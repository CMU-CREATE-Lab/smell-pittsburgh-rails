class AchdForm < ActiveRecord::Base

  # smell_report :SmellReport
  # email :string
  # phone :string
  # name :string
  # address :string

  belongs_to :smell_report

  def formatted_server_email
    return "smellpgh-reports+#{self.id}@createlab.org"
  end


  # PARAMS
  # smell_report: SmellReport - The smell report that the email is being sent for.
  # options["reply_email"]: String - the user specifies this when it wants to receive a response from ACHD.
  # options["name"]: String
  # options["phone_number"]: String
  # options["address"]: String
  def self.submit_form(smell_report, options={})
    reply_email = options["reply_email"] ? "" : options["reply_email"]
    name = options["name"] ? "" : options["name"]
    phone_number = options["phone_number"] ? "" : options["phone_number"]
    user_address = options["address"] ? "" : options["address"]

    # request reverse geocode object
    geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{smell_report.real_latitude}, #{smell_report.real_longitude}" )

    # if reverse geocoding fails, we want to avoid submitting a form (since the location may either be invalid, or failed for another reason and we don't want to expose the precise location)
    if geo.full_address.blank?
      Rails.logger.info("ACHD Form (GoogleGeocoder Error): reverse geocoding failed on smell report id=#{smell_report.id} with lat/long='#{smell_report.latitude}, #{smell_report.longitude}'; achd form not submitted")
    else
      # construct object
      form = AchdForm.new
      form.smell_report = smell_report
      form.email = reply_email
      form.phone = phone_number
      form.name = name
      form.address = user_address
      form.save!

      Rails.logger.info("------")
      Rails.logger.info("user_hash=(#{smell_report.user_hash})")
      email = AchdMailer.mail(form)
      # do not send from dev/staging environments
      if Rails.env == "production"
        email.deliver!
      else
        Rails.logger.info("ACHD Form (non-production): generated email:\n#{email.body}")
      end
      Rails.logger.info("======")
    end
  end

end
