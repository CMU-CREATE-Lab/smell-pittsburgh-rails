class RemoveRegionReferenceFromAgencyForm < ActiveRecord::Migration
  def change
    remove_reference :agency_forms, :region, index: true, foreign_key: true
  end
end
