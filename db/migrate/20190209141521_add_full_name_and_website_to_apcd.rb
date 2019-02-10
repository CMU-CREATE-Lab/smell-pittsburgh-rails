class AddFullNameAndWebsiteToApcd < ActiveRecord::Migration
  def change
    agency = Agency.find_by_name("APCD")
    agency.full_name = "Air Pollution Control District"
    agency.website = "https://louisvilleky.gov/government/air-pollution-control-district/contact-apcd"
    agency.save!
  end
end
