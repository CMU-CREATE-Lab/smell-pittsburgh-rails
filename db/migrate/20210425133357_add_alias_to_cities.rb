class AddAliasToCities < ActiveRecord::Migration
  def change
    add_column :cities, :alias, :string
  	city = City.first
    city.alias = "PGH"
  	city.save!
    state = State.find_by_state_code("OR")
    city = City.find_by_name_and_state_id("Portland", state.id)
    city.alias = "PDX"
    city.save!
    state = State.find_by_state_code("CA")
    city = City.find_by_name_and_state_id("Bay Area", state.id)
    city.alias = "BA"
    city.save!
    city = City.find_by_name("Louisville")
    city.alias = "LOU"
    city.save!
  end
end

