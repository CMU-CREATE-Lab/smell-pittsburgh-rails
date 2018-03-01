class AddAgencyReferenceToAgencyForm < ActiveRecord::Migration
  def change
    add_reference :agency_forms, :agency, index: true, foreign_key: true
  end
end
