class ModifyLawrencevilleAchdMarker < ActiveRecord::Migration
  def up
    markers = [
      [
        {"name":"County AQ Monitor - Lawrenceville",
         "sensors":{
           "wind_speed":{
             "sources":[
               {"feed":26,"channel":"SONICWS_MPH"}
              ]
           },
           "wind_direction":{
             "sources":[
               {"feed":26,"channel":"SONICWD_DEG"}
             ]
           },
           "PM25":{
             "sources":[
               {"feed":26,"channel":"PM25B_UG_M3"},
               {"feed":26,"channel":"PM25T_UG_M3"},
               {"feed":59665,"channel":"PM25_640_UG_M3"}
             ]
           }
          },
        },
        40.4654,
        -79.9608
      ]
    ]
   markers.each do |item|
      m = City.find_by_name("Pittsburgh").map_markers.where("latitude LIKE ? AND longitude LIKE ?", item[1], item[2]).first
      m.data = item[0].to_json
      m.save!
    end
  end
end