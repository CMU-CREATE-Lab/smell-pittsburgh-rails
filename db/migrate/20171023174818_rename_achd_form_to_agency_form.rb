class RenameAchdFormToAgencyForm < ActiveRecord::Migration
  def change
    rename_table :achd_forms, :agency_forms
  end
end
