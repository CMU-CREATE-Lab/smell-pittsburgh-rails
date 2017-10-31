class AddDescriptionToRegions < ActiveRecord::Migration
  def change
    add_column :regions, :description, :text
  end
end
