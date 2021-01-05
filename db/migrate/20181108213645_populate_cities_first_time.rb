class PopulateCitiesFirstTime < ActiveRecord::Migration
  def change
    cities = [
      {
        "name" => "Pittsburgh",
        "state_code" => "PA",
        "latitude" => "40.45",
        "longitude" => "-79.93",
        "zoom_level" => "11",
        "description" => "",
        "region_ids" => [1],
        "zipcodes" =>  ["15006", "15007", "15014", "15015", "15017", "15018", "15020", "15024", "15025", "15028", "15030", "15031", "15032", "15034", "15035", "15037", "15044", "15045", "15046", "15047", "15049", "15051", "15056", "15064", "15065", "15071", "15075", "15076", "15082", "15084", "15086", "15088", "15090", "15091", "15095", "15096", "15101", "15102", "15104", "15106", "15108", "15110", "15112", "15116", "15120", "15122", "15123", "15126", "15127", "15129", "15131", "15132", "15133", "15134", "15135", "15136", "15137", "15139", "15140", "15142", "15143", "15144", "15145", "15146", "15147", "15148", "15201", "15202", "15203", "15204", "15205", "15206", "15207", "15208", "15209", "15210", "15211", "15212", "15213", "15214", "15215", "15216", "15217", "15218", "15219", "15220", "15221", "15222", "15223", "15224", "15225", "15226", "15227", "15228", "15229", "15230", "15231", "15232", "15233", "15234", "15235", "15236", "15237", "15238", "15239", "15240", "15241", "15242", "15243", "15244", "15250", "15251", "15252", "15253", "15254", "15255", "15257", "15258", "15259", "15260", "15261", "15262", "15264", "15265", "15267", "15268", "15270", "15272", "15274", "15275", "15276", "15277", "15278", "15279", "15281", "15282", "15283", "15286", "15289", "15290", "15295"],
        "app_metadata" => {
          "side_menu_background_url" => "/img/app-images/side-menu-backgrounds/pittsburgh-pa.png",
          "side_menu_background_color" => "#97c93c",
          "smell_description_placeholder_text" => "e.g. industrial, woodsmoke, rotten-eggs"
        }
      },
      {
        "name" => "Louisville",
        "state_code" => "KY",
        "latitude" => "38.25",
        "longitude" => "-85.75",
        "zoom_level" => "11",
        "description" => "",
        "region_ids" => [2],
        "zipcodes" => ["40018","40023","40025","40027","40041","40059","40118","40201","40202","40203","40204","40205","40206","40207","40208","40209","40210","40211","40212","40213","40214","40215","40216","40217","40218","40219","40220","40221","40222","40223","40224","40225","40228","40229","40231","40232","40233","40241","40242","40243","40245","40250","40251","40252","40253","40255","40256","40257","40258","40259","40261","40266","40268","40269","40270","40272","40280","40281","40282","40283","40285","40287","40289","40290","40291","40292","40293","40294","40295","40296","40297","40298","40299"],
        "app_metadata" => {
          "side_menu_background_url" => "/img/app-images/side-menu-backgrounds/louisville-ky.png",
          "side_menu_background_color" => "#24bab1",
          "smell_description_placeholder_text" => "e.g. chemical, sewer-like, flowery, burnt"
        }
      }
    ]
    cities.each do |city|
      city_obj = City.new
      city_obj.name = city['name']
      city_obj.state_code = city['state_code']
      city_obj.latitude = city['latitude']
      city_obj.longitude = city['longitude']
      city_obj.zoom_level = city['zoom_level']
      city_obj.description = city['description']
      city_obj.app_metadata = city['app_metadata']
      city_obj.zip_codes.push( city['zipcodes'].map{|i| ZipCode.find_or_create_by(:zip => i)} )
      city_obj.regions.push( city['region_ids'].map{|i| Region.find(i)} )
      city_obj.save!
    end
  end
end


