class AchdForm < ActiveRecord::Base

  belongs_to :smell_report

  def formatted_server_email
    return "smellpgh-reports+#{self.id}@createlab.org"
  end


  # PARAMS
  # smell_report: SmellReport - The smell report that the email is being sent for.
  # options["reply_email"]: String - the user specifies this when it wants to receive a response from ACHD.
  # options["name"]: String
  # options["phone_number"]: String
  def self.submit_form(smell_report, options={})
    reply_email = options["reply_email"] ? "" : options["reply_email"]
    name = options["name"] ? "" : options["name"]
    phone_number = options["phone_number"] ? "" : options["phone_number"]

    # request reverse geocode object
    geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{smell_report.latitude}, #{smell_report.longitude}" )

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
      form.save!

      # construct form fields
      form_fields = {}
      form_fields["name"] = form.name.blank? ? "CREATE Lab" : form.name
      form_fields["phone"] = form.phone.blank? ? "" : form.phone
      form_fields["email"] = form.formatted_server_email
      form_fields["subject"] = "Smell Report"
      # comment field
      body = ""
      body += "An odor was detected near #{geo.street_address}, #{geo.zip} on #{smell_report.created_at.localtime.strftime("%d %B %Y")} at #{smell_report.created_at.localtime.strftime("%I:%M %p %Z")}. On a scale of 1 to 5, with 5 being the worst, the odor was rated as #{smell_report.smell_value}."
      unless smell_report.smell_description.blank? and smell_report.feelings_symptoms.blank?
        body += "\n\n"
        body += "The smell was described as: #{smell_report.smell_description}. " unless smell_report.smell_description.blank?
        body += "Residents reported the following symptoms during the time the odor was detected: #{smell_report.feelings_symptoms}." unless smell_report.feelings_symptoms.blank?
      end
      body += "\n\n"
      body += "This report was generated through the Smell PGH app: http://www.cmucreatelab.org/projects/Smell_Pittsburgh"
      body += "\n\n"
      body += "Please respond to this report by emailing #{form.formatted_server_email}"
      body += " and #{form.email}" unless form.email.blank?
      body +=". All app users will be notified of this response."
      form_fields["comment"] = body

      # curl form
      url = "http://www.achd.net/thanksnew.php"
      # do not send from dev/staging environments
      if Rails.env == "production"
        Rails.logger.info("ACHD Form: curl -X POST #{url} -d #{form_fields.to_json}")
        response = `curl -X POST #{url} -d #{form_fields.to_json}`
        Rails.logger.info("ACHD Form response: #{response}")
      else
        Rails.logger.info("ACHD Form (non-production): curl -X POST #{url} -d #{form_fields.to_json}")
      end
    end
  end

end
