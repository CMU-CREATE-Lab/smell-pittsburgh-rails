class ModifyAvalonAchdMarker < ActiveRecord::Migration
  def up
    markers = [
      [
        {"name":"County AQ Monitor - Avalon",
         "sensors":{
           "wind_speed":{
             "sources":[
               {"feed":1,"channel":"SONICWS_MPH"}
              ]
           },
           "wind_direction":{
             "sources":[
               {"feed":1,"channel":"SONICWD_DEG"}
             ]
           },
           "PM25":{
             "sources":[
               {"feed":1,"channel":"PM25B_UG_M3"},
               {"feed":1,"channel":"PM25T_UG_M3"},
               {"feed":1,"channel":"PM25_640_UG_M3"}
             ]
           }
          },
        },
        40.4998,
        -80.0713
      ]
    ]
   markers.each do |item|
      m = City.find_by_name("Pittsburgh").map_markers.where("latitude LIKE ? AND longitude LIKE ?", item[1], item[2]).first
      m.data = item[0].to_json
      m.save!
    end
  end
end
