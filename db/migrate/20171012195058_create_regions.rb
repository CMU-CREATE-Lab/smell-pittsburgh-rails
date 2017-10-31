class CreateRegions < ActiveRecord::Migration
  def change
    create_table :regions do |t|
      t.float :latitude
      t.float :longitude
      t.integer :zoom_level
      t.string :name
      #t.references :zip_codes, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
