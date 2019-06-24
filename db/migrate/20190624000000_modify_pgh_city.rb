class ModifyPghCity < ActiveRecord::Migration
  def up
    city_obj = City.first
    city_obj.latitude = 40.394
    city_obj.longitude = -79.914
    city_obj.save!
  end
end