class AddMapMarkerDecommissionedEpochTimeField < ActiveRecord::Migration
  def change
    add_column :map_markers, :decommissioned_date, :bigint, :default => nil
  end
end