class CreateJoinTableAgenciesRegions < ActiveRecord::Migration
  def change
    create_join_table :agencies, :regions
  end
end
