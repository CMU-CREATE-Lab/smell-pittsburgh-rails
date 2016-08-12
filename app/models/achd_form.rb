class AchdForm < ActiveRecord::Base


	# PARAMS
	# smell_report: SmellReport - The smell report that the email is being sent for.
	# options["reply_email"]: String - the user specifies this when it wants to receive a response from ACHD.
	# options["name"]: String
	# options["phone_number"]: String
	def self.submit_form(smell_report, options={})
		reply_email = options["reply_email"] ? "" : options["reply_email"]
		name = options["name"] ? "" : options["name"]
		phone_number = options["phone_number"] ? "" : options["phone_number"]
		Rails.logger.info("AchdForm with reply email=#{reply_email}")
		
		# sample use of geokit (see: https://github.com/geokit/geokit-rails)
		full_address = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{smell_report.latitude}, #{smell_report.longitude}" ).full_address

		# TODO curl actions
	end

end
