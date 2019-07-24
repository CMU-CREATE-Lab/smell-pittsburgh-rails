class AddPortlandOregonMarkers < ActiveRecord::Migration
  def up
    markers = [
      [{
        "name":"Portland - SE Lafayette AirNow",
        "sensors":{"PM25":{"sources":[{"feed":3493,"channel":"PM2_5"}]}}
        },
        45.496641,
        -122.602877
      ],
      [{
        "name":"Beaverton - Highland Park School AirNow",
        "sensors":{"PM25":{"sources":[{"feed":3502,"channel":"PM2_5"}]}}
        },
        45.4702,
        -122.8159
      ],
      [{
        "name":"Hillsboro - Hare Field AirNow",
        "sensors":{"PM25":{"sources":[{"feed":3501,"channel":"PM2_5"}]}}
        },
        45.528501,
        -122.972398
      ],
      [{
        "name":"Portland Near Road AirNow",
        "sensors":{"PM25":{"sources":[{"feed":4122,"channel":"PM2_5"}]}}
        },
        45.39916,
        -122.7455
      ],
       [{
         "name":"Portland - Spangler Road AirNow",
         "sensors":{"PM25":{"sources":[{"feed":3464,"channel":"PM2_5"}]}}
         },
         45.25928,
         -122.588151
      ]
    ]

    s = State.find_by_state_code("OR")
    c = City.find_by_name_and_state_id("Portland", s.id)

    markers.each do |item|
      m = MapMarker.new
      m.city_id = c.id
      m.marker_type = "esdr_feed"
      m.data = item[0].to_json
      m.latitude = item[1]
      m.longitude = item[2]
      m.save!
    end
  end
end


