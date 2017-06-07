class AchdForm < ActiveRecord::Base

  # smell_report :SmellReport
  # email :string
  # phone :string
  # name :string
  # address :string

  belongs_to :smell_report

  # # this only works if we are saving records (which we are not)
  # def formatted_server_email
  #   return "smellpgh-reports+#{self.id}@createlab.org"
  # end

  def self.allegheny_county_zipcodes
    return ["15006", "15007", "15014", "15015", "15017", "15018", "15020", "15024", "15025", "15028", "15030", "15031", "15032", "15034", "15035", "15037", "15044", "15045", "15046", "15047", "15049", "15051", "15056", "15064", "15065", "15071", "15075", "15076", "15082", "15084", "15086", "15088", "15090", "15091", "15095", "15096", "15101", "15102", "15104", "15106", "15108", "15110", "15112", "15116", "15120", "15122", "15123", "15126", "15127", "15129", "15131", "15132", "15133", "15134", "15135", "15136", "15137", "15139", "15140", "15142", "15143", "15144", "15145", "15146", "15147", "15148", "15201", "15202", "15203", "15204", "15205", "15206", "15207", "15208", "15209", "15210", "15211", "15212", "15213", "15214", "15215", "15216", "15217", "15218", "15219", "15220", "15221", "15222", "15223", "15224", "15225", "15226", "15227", "15228", "15229", "15230", "15231", "15232", "15233", "15234", "15235", "15236", "15237", "15238", "15239", "15240", "15241", "15242", "15243", "15244", "15250", "15251", "15252", "15253", "15254", "15255", "15257", "15258", "15259", "15260", "15261", "15262", "15264", "15265", "15267", "15268", "15270", "15272", "15274", "15275", "15276", "15277", "15278", "15279", "15281", "15282", "15283", "15286", "15289", "15290", "15295"]
  end


  # PARAMS
  # smell_report: SmellReport - The smell report that the email is being sent for.
  # options["reply_email"]: String - the user specifies this when it wants to receive a response from ACHD.
  # options["name"]: String
  # options["phone_number"]: String
  # options["address"]: String
  def self.submit_form(smell_report, options={})
    reply_email = options[:reply_email].blank? ? "" : options[:reply_email]
    name = options[:name].blank? ? "" : options[:name]
    phone_number = options[:phone_number].blank? ? "" : options[:phone_number]
    user_address = options[:address].blank? ? "" : options[:address]
    geo = options[:geo].blank? ? {} : options[:geo]

    # if reverse geocoding fails, we want to avoid submitting a form (since the location may either be invalid, or failed for another reason and we don't want to expose the precise location)
    if geo.full_address.blank?
      Rails.logger.info("ACHD Form (GoogleGeocoder Error): reverse geocoding failed on smell report id=#{smell_report.id} with lat/long='#{smell_report.latitude}, #{smell_report.longitude}'; achd form not submitted")
    elsif not geo.zip.blank?
      # only send to ACHD if the zipcode is part of allegheny county
      if AchdForm.allegheny_county_zipcodes.include?(geo.zip)
        # construct object
        form = AchdForm.new
        form.smell_report = smell_report
        form.email = reply_email
        form.phone = phone_number
        form.name = name
        form.address = user_address
        # ... but do not save it
        #form.save!

        Rails.logger.info("------")
        Rails.logger.info("user_hash=(#{smell_report.user_hash})")
        email = AchdMailer.email(form,geo.street_address,geo.zip)
        # do not send from dev/staging environments
        if Rails.env == "production"
          email.deliver!
          Rails.logger.info("ACHD Form: email delivered")
        else
          Rails.logger.info("ACHD Form (non-production): generated email:\n#{email.body}")
        end
        Rails.logger.info("======")
      else
        Rails.logger.info("ACHD Form (GoogleGeocoder Error): zipcode on smell report id=#{smell_report.id} was #{geo.zip} and is not in list allegheny_county_zipcodes; achd form not submitted")
      end
    else
      Rails.logger.info("ACHD Form (GoogleGeocoder Error): failed to reverse geocode a zipcode on smell report id=#{smell_report.id} with lat/long='#{smell_report.latitude}, #{smell_report.longitude}'; achd form not submitted")
    end
  end

end
