class AddTimezonesToCities < ActiveRecord::Migration
  def change
  	add_column :cities, :gmt_offset, :tinyint
    add_column :cities, :abbrev, :string
  	city = City.first
  	city.gmt_offset = -5
    city.abbrev = "PGH"
  	city.save!
    state = State.find_by_state_code("OR")
    city = City.find_by_name_and_state_id("Portland", state.id)
    city.gmt_offset = -8
    city.abbrev = "PDX"
    city.save!
    state = State.find_by_state_code("CA")
    city = City.find_by_name_and_state_id("Bay Area", state.id)
    city.gmt_offset = -8
    city.abbrev = "BA"
    city.save!
    city = City.find_by_name("Louisville")
    city.gmt_offset = -5
    city.abbrev = "LOU"
    city.save!
  end
end
