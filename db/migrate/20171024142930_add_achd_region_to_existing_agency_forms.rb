class AddAchdRegionToExistingAgencyForms < ActiveRecord::Migration
  def change
    achd = Region.find(1)
    AgencyForm.all.each do |form|
      form.region = achd
      form.save!
    end
  end
end
