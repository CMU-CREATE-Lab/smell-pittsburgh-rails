class Agency < ActiveRecord::Base
  has_and_belongs_to_many :regions
  has_many :agency_forms


  # smell_report: SmellReport - The smell report that the email is being sent for.
  # options["reply_email"]: String - the user specifies this when it wants to receive a response from ACHD.
  # options["name"]: String
  # options["phone_number"]: String
  # options["address"]: String
  def create_and_submit_form(smell_report, options={})
    agency_name = options[:agency_name].blank? ? "" : options[:agency_name]
    agency_email = options[:agency_email].blank? ? "" : options[:agency_email]
    reply_email = options[:reply_email].blank? ? "" : options[:reply_email]
    name = options[:name].blank? ? "" : options[:name]
    phone_number = options[:phone_number].blank? ? "" : options[:phone_number]
    user_address = options[:address].blank? ? "" : options[:address]
    geo = options[:geo].blank? ? {} : options[:geo]

    # if reverse geocoding fails, we want to avoid submitting a form (since the location may either be invalid, or failed for another reason and we don't want to expose the precise location)
    if geo.full_address.blank?
      Rails.logger.info("Agency Form (GoogleGeocoder Error): reverse geocoding failed on smell report id=#{smell_report.id} with lat/long='#{smell_report.latitude}, #{smell_report.longitude}'; agency form not submitted")
    elsif not geo.zip.blank?
      # TODO only does ACHD for now
      if self == Agency.where(:name => "ACHD").first
        # construct object
        form = AgencyForm.new
        form.smell_report = smell_report
        form.email = reply_email
        form.phone = phone_number
        form.name = name
        form.address = user_address
        form.agency = self
        form.save!

        client = Client.find_by_id(smell_report.client_id)
        if (options[:agency_name] and options[:agency_email])
          email = GenericMailer.email(form,geo.street_address,geo.zip,agency_email,agency_name,client)
        else
          Rails.logger.info("Agency Form: No agency name or email specified")
          return
        end

        # do not send from dev/staging environments
        if Rails.env == "production"
          email.deliver!
          Rails.logger.info("Agency Form: email delivered")
        else
          Rails.logger.info("Agency Form (non-production): generated email:\n#{email.body}")
        end
        Rails.logger.info("======")
      else
        Rails.logger.info("Agency Form (GoogleGeocoder Error): zipcode on smell report id=#{smell_report.id} was #{geo.zip} and is not in AC; agency form not submitted")
      end
    else
      Rails.logger.info("Agency Form (GoogleGeocoder Error): failed to reverse geocode a zipcode on smell report id=#{smell_report.id} with lat/long='#{smell_report.latitude}, #{smell_report.longitude}'; agency form not submitted")
    end
  end

end
