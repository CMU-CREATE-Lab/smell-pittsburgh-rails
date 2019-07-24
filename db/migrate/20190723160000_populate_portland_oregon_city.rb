class PopulatePortlandOregonCity < ActiveRecord::Migration
  def change
    cities = [
      {
        "name" => "Portland",
        "latitude" => "45.515",
        "longitude" => "-122.68",
        "zoom_level" => "11",
        "description" => "",
        "region_ids" => [2],
        "zipcodes" =>  ["97034", "97035", "97080", "97086", "97201", "97202", "97203", "97204", "97205", "97206", "97208", "97209", "97210", "97211", "97212", "97213", "97214", "97215", "97216", "97217", "97218", "97219", "97220", "97221", "97222", "97223", "97225", "97227", "97229", "97230", "97231", "97232", "97233", "97236", "97239", "97266", "97010", "97019", "97030", "97024", "97256", "97207", "97228", "97238", "97240", "97242", "97258", "97280", "97282", "97283", "97286", "97290", "97292", "97293", "97294", "97296", "97299", "97060"],
        "app_metadata" => {
          "side_menu_background_url" => "/img/app-images/side-menu-backgrounds/portland-or.png",
          "side_menu_background_color" => "#24bab1"
        }
      }
    ]
    state = State.find_or_create_by(:state_code => "OR")
    cities.each do |city|
      city_obj = City.new
      city_obj.name = city['name']
      city_obj.latitude = city['latitude']
      city_obj.longitude = city['longitude']
      city_obj.zoom_level = city['zoom_level']
      city_obj.description = city['description']
      city_obj.app_metadata = city['app_metadata']
      city_obj.state_id = state.id
      new_zip_codes = city['zipcodes'].map do |i|
        ZipCode.create_with(
          zip: i,
          state_id: state.id
        ).find_or_create_by(
          zip: i
        )
      end
      city_obj.zip_codes.push(new_zip_codes)
      city_obj.regions.push( city['region_ids'].map{|i| Region.find(i)} )
      city_obj.save!
    end
  end
end


