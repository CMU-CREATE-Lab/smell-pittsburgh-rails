class CreateCities < ActiveRecord::Migration
  def change
    create_table :cities do |t|
      t.float :latitude
      t.float :longitude
      t.integer :zoom_level
      t.string :name
      t.string :state_code
      t.text :description
      t.text :app_metadata

      t.timestamps null: false
    end
  end
end


