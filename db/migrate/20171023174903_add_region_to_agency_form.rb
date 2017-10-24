class AddRegionToAgencyForm < ActiveRecord::Migration
  def change
    add_reference :agency_forms, :region, index: true, foreign_key: true
  end
end
