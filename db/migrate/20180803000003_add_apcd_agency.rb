class AddApcdAgency < ActiveRecord::Migration
  def change
    agency = Agency.new
    agency.name = "APCD"
    agency.email = "airissue@louisvilleky.gov"
    # add Jefferson County to APCD regions
    agency.regions.push(Region.find(2))
    agency.save!
  end
end
