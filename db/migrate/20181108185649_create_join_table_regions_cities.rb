class CreateJoinTableRegionsCities < ActiveRecord::Migration
  def change
    create_join_table :regions, :cities
  end
end
