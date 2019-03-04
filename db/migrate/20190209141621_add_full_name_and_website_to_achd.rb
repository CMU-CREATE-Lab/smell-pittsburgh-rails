class AddFullNameAndWebsiteToAchd < ActiveRecord::Migration
  def change
    agency = Agency.find_by_name("ACHD")
    agency.full_name = "Allegheny County Health Department"
    agency.website = "https://www.alleghenycounty.us/Health-Department/Contact.aspx"
    agency.save!
  end
end
