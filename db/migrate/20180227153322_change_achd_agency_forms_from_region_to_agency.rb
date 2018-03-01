class ChangeAchdAgencyFormsFromRegionToAgency < ActiveRecord::Migration
  def change
    achd = Agency.where(:name => "ACHD").first
    AgencyForm.all.each do |form|
      form.agency = achd
      form.save!
    end
  end
end
