class RenameMapMarkersRegionIdToCityId < ActiveRecord::Migration
  def change
    rename_column :map_markers, :region_id, :city_id
  end
end
