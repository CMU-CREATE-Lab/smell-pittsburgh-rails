class ModifyJeffersonkyMarkers < ActiveRecord::Migration
  def up
    MapMarker.reset_column_information
    markers = [
      [{
        "name":"Near Road AirNow",
        "sensors":{
          "PM25":{"sources":[{"feed":4174,"channel":"PM2_5"}]},
          "SO2":{"sources":[{"feed":4174,"channel":"SO2"}]},
        }},
        38.1935,
        -85.7121,
      ]
    ]
   markers.each do |item|
      m = MapMarker.new
      m.city_id = 2
      m.marker_type = "esdr_feed"
      m.data = item[0].to_json
      m.latitude = item[1]
      m.longitude = item[2]
      m.save!
    end
  end
  # Remove PurpleAirs added in a prior migration
  City.find_by_name("Louisville").map_markers.where("latitude LIKE ? AND longitude LIKE ?", 38.2989, -85.6471).destroy_all
end
