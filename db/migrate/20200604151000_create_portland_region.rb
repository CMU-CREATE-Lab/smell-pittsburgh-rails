class CreatePortlandRegion < ActiveRecord::Migration
  def change

    r = Region.new
    r.name = "Portland Area"
    r.description = "Selected Portland zip codes"
    r.latitude = 45.515
    r.longitude = -122.68
    r.zoom_level = 11

    all_zips = ["97034", "97035", "97080", "97086", "97201", "97202", "97203", "97204", "97205", "97206", "97208", "97209", "97210", "97211", "97212", "97213", "97214", "97215", "97216", "97217", "97218", "97219", "97220", "97221", "97222", "97223", "97225", "97227", "97229", "97230", "97231", "97232", "97233", "97236", "97239", "97266", "97010", "97019", "97030", "97024", "97256", "97207", "97228", "97238", "97240", "97242", "97258", "97280", "97282", "97283", "97286", "97290", "97292", "97293", "97294", "97296", "97299", "97060"]

    r.zip_codes.push( all_zips.map{|i| ZipCode.find_or_create_by(:zip => i)} )
    r.save!

    # Fix incorrect region set for Portland
    state = State.find_by_state_code("OR")
    city = City.find_by_name_and_state_id("Portland", state.id)
    city.region_ids = [r.id]

  end
end
