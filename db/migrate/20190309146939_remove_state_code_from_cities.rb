class RemoveStateCodeFromCities < ActiveRecord::Migration
  def change
    remove_column :cities, :state_code
  end
end
