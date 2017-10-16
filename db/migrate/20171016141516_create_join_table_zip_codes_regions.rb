class CreateJoinTableZipCodesRegions < ActiveRecord::Migration
  def change
    create_join_table :zip_codes, :regions
  end
end
