class PopulateBayAreaCaliforniaCity < ActiveRecord::Migration
  def change
    cities = [
      {
        "name" => "Bay Area",
        "latitude" => "38.017810",
        "longitude" => "-122.259395",
        "zoom_level" => "10",
        "description" => "",
        #"region_ids" => [2],
        "zipcodes" =>  ["94801", "94804", "94805", "94806", "94510", "94525", "94547", "94553", "94564", "94569", "94572", "94590", "94591", "94592"],
        "app_metadata" => {
          "smell_description_placeholder_text" => "e.g. fire/smoke, rotten-eggs, burnt-match",
          "feelings_symptoms_placeholder_text" => "e.g. difficulty breathing, headaches, eye irritation",
          "additional_notes_placeholder_text" => "e.g. suspected source, duration or recurrence of event, symptoms in pets and/or describe what you see - e.g. large or continuous flare, gunk on car, black dust on windowsill",
          "side_menu_background_url" => "/img/app-images/side-menu-backgrounds/default.png",
          "side_menu_background_color" => "#97c93c"
        }
      }
    ]
    state = State.find_or_create_by(:state_code => "CA")
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
      #city_obj.regions.push( city['region_ids'].map{|i| Region.find(i)} )
      city_obj.save!
    end
  end
end
