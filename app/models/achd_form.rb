class AchdForm < ActiveRecord::Base

  belongs_to :smell_report


  # PARAMS
  # smell_report: SmellReport - The smell report that the email is being sent for.
  # options["reply_email"]: String - the user specifies this when it wants to receive a response from ACHD.
  # options["name"]: String
  # options["phone_number"]: String
  def self.submit_form(smell_report, options={})
    # fields
    reply_email = options["reply_email"] ? "" : options["reply_email"]
    name = options["name"] ? "" : options["name"]
    phone_number = options["phone_number"] ? "" : options["phone_number"]

    # construct object
    form = AchdForm.new
    form.smell_report = smell_report
    form.email = reply_email
    form.phone = phone_number
    form.name = name
    form.save!

    Rails.logger.info("AchdForm with reply email=#{reply_email}")
    
    # sample use of geokit (see: https://github.com/geokit/geokit-rails)
    full_address = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{smell_report.latitude}, #{smell_report.longitude}" ).full_address

    # TODO curl actions

    # # template:
    # An odor was detected near #{geo.street_address}, #{geo.zip} on #{smell_report.created_at.localtime.strftime("%d %B %Y")} at #{smell_report.created_at.localtime.strftime("%I:%M %p %Z")}. On a scale of 1 to 5, with 5 being the worst, the odor was rated as #{smell_report.smell_value}.
    #
    # The smell was described as: #{smell_report.smell_description}. Residents reported the following symptoms during the time the odor was detected: #{smell_report.smell_description}.
    #
    # This report was generated through the Smell PGH app: http://www.cmucreatelab.org/projects/Smell_Pittsburgh
    #
    # Please respond to this report by emailing ((our email)) and ((user’s email if provided)). All app users will be notified of this response.
  end

end
