class CreateMapMarkers < ActiveRecord::Migration
  def change
    create_table :map_markers do |t|
      t.float :latitude
      t.float :longitude
      t.string :marker_type
      t.text :data
      t.references :region

      t.timestamps null: false
    end
  end
end
