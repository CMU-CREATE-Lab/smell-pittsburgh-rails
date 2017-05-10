class AddIndexToZipCodesZip < ActiveRecord::Migration
  def change
    add_index :zip_codes, :zip
  end
end
