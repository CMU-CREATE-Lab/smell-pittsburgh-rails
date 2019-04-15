class AddStateIdToZipCodes < ActiveRecord::Migration
  def change
    add_column :zip_codes, :state_id, :integer, index: true
  end
end
