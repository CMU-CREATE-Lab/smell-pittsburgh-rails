class AddAddressForAchdForms < ActiveRecord::Migration
  def change
    add_column :achd_forms, :address, :string
  end
end
