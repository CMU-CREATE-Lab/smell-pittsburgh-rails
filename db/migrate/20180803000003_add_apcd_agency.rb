class AddApcdAgency < ActiveRecord::Migration
  def change
    agency = Agency.new
    agency.name = "APCD"
    # add Jefferson County to APCD regions
    agency.regions.push(Region.find(2))
    agency.save!
  end
end
