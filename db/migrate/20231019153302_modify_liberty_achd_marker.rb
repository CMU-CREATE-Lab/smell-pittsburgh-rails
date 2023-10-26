class ModifyLibertyAchdMarker < ActiveRecord::Migration
  def up
    markers = [
      [
        {"name":"County AQ Monitor - Liberty",
          "sensors":{
            "wind_speed":{
              "sources":[
                {"feed":28,"channel":"SONICWS_MPH"}
              ]
            },
            "wind_direction":{
              "sources":[
                {feed:28,"channel":"SONICWD_DEG"}
              ]
            },
            "PM25":{
              "sources":[
                {"feed":29,"channel":"PM25_UG_M3"},
                {"feed":29,"channel":"PM25T_UG_M3"},
                {"feed":29,"channel":"PM25_640_UG_M3"}
              ]
            }
          }
        },
        40.3238,
        -79.8681
      ],     
    ]
   markers.each do |item|
      m = City.find_by_name("Pittsburgh").map_markers.where("latitude LIKE ? AND longitude LIKE ?", item[1], item[2]).first
      m.data = item[0].to_json
      m.save!
    end
  end
end
