class AddAchdAgency < ActiveRecord::Migration
  def change
    agency = Agency.new
    agency.name = "ACHD"
    agency.email = ACHD_EMAIL_RECIPIENT
    # add Allegheny County to ACHD regions
    agency.regions.push(Region.find(1))
    agency.save!
  end
end
