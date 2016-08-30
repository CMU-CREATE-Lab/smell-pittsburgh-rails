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
      body += "Dear Dr. Karen Hacker and the Allegheny County Health Department,"
      body += "\n\n"
      body += "I noticed an unusual smell at #{geo.street_address}, #{geo.zip} on #{smell_report.created_at.localtime.strftime("%d %B %Y")} at #{smell_report.created_at.localtime.strftime("%I:%M %p %Z")}. I’d rate the smell #{smell_report.smell_value} on a scale of 1 to 5, with 5 being the worst odor."
      unless smell_report.smell_description.blank? and smell_report.feelings_symptoms.blank?
        body += "\n\n"
        body += "The smell was #{smell_report.smell_description}. " unless smell_report.smell_description.blank?
        body += "I noticed the following symptoms when I smelled the odor: #{smell_report.feelings_symptoms}." unless smell_report.feelings_symptoms.blank?
      end
      body += "\n\n"
      body += "Please let me know if there were particular causes of this smell and what health impacts could result by emailing me"
      body += " at #{form.email}." unless form.email.blank?
      body += "\n\n"
      body += "Thank you,\n#{form_fields["name"]}"

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
