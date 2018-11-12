class CreateJoinTableZipCodesCities < ActiveRecord::Migration
  def change
    create_join_table :zip_codes, :cities
  end
end
