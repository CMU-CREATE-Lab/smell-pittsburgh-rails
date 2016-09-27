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

      if geo.street_address.empty?
        if geo.zip.empty?
          # no location info available
          body += "I noticed an unusual smell on #{smell_report.created_at.localtime.strftime("%d %B %Y")} at #{smell_report.created_at.localtime.strftime("%I:%M %p %Z")}. I'd rate the smell #{smell_report.smell_value} on a scale of 1 to 5, with 5 being the worst odor."
        else
          # only zipcode available
          body += "I noticed an unusual smell at zipcode: #{geo.zip} on #{smell_report.created_at.localtime.strftime("%d %B %Y")} at #{smell_report.created_at.localtime.strftime("%I:%M %p %Z")}. I'd rate the smell #{smell_report.smell_value} on a scale of 1 to 5, with 5 being the worst odor."
        end
      else
        # street address and zipcode
        body += "I noticed an unusual smell at #{geo.street_address}, #{geo.zip} on #{smell_report.created_at.localtime.strftime("%d %B %Y")} at #{smell_report.created_at.localtime.strftime("%I:%M %p %Z")}. I'd rate the smell #{smell_report.smell_value} on a scale of 1 to 5, with 5 being the worst odor."
      end

      unless smell_report.smell_description.blank? and smell_report.feelings_symptoms.blank?
        body += "\n\n"
        body += "Below are some things I noticed about this smell episode."
        body += "\nSmell/Source Description: #{smell_report.smell_description}. " unless smell_report.smell_description.blank?
        body += "\nMy Symptoms: #{smell_report.feelings_symptoms}." unless smell_report.feelings_symptoms.blank?
      end
      body += "\n\n"
      body += "Please let me know if there were particular causes of this smell and what health impacts could result by emailing #{form.formatted_server_email}."
      unless smell_report.additional_comments.blank?
        body += "\n\n#{smell_report.additional_comments}"
      end
      body += "\n\n"
      body += "Thank you,\n#{form_fields["name"]}"
      body += "\n\n"
      body += "This report was generated through the Smell PGH app: http://www.cmucreatelab.org/projects/Smell_Pittsburgh\nEmail: smellpgh-reports@cmucreatelab.org"

      form_fields["comment"] = body

      # curl form
      url = "http://www.achd.net/thanksnew.php"
      Rails.logger.info("------")
      Rails.logger.info("user_hash=(#{smell_report.user_hash})")
      # do not send from dev/staging environments
      if Rails.env == "production"
        Rails.logger.info("ACHD Form: curl -X POST #{url} -d #{form_fields.to_json}")
        response = `curl -X POST #{url} -d #{form_fields.to_json}`
        Rails.logger.info("ACHD Form response: #{response}")
      else
        Rails.logger.info("ACHD Form (non-production): curl -X POST #{url} -d #{form_fields.to_json}")
      end
      Rails.logger.info("======")
    end
  end

end
