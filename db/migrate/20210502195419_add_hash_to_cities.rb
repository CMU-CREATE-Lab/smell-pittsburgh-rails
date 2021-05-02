class AddHashToCities < ActiveRecord::Migration
  	add_column :cities, :hashed, :string
	City.all.each do |city|
	  Rails.logger.info(ApplicationHelper.hash_city(city.name,State.find_by_id(city.state_id).state_code))
	  city.hashed = ApplicationHelper.hash_city(city.name,State.find_by_id(city.state_id).state_code)
	  city.save!
	end
end
