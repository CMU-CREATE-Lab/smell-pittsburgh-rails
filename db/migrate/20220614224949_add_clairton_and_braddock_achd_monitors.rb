class AddClairtonAndBraddockAchdMonitors < ActiveRecord::Migration
def up
    markers = [
      [{
        "name":"Clairton ACHD",
        "sensors":{"PM25":{"sources":[{"feed":26086,"channel":"PM25_640_UG_M3"}]}}
        },
        40.294341,
        -79.885331
      ],
      [{
        "name":"North Braddock ACHD",
        "sensors":{"wind_speed":{"sources":[{"feed":3,"channel": "SONICWS_MPH"}]},"wind_direction":{"sources":[{"feed":3,"channel":"SONICWD_DEG"}]},"PM25":{"sources":[{"feed":3,"channel":"PM25_640_UG_M3"}]}}
        },
        40.402328,
        -79.860973
      ]
    ]

    s = State.find_by_state_code("PA")
    c = City.find_by_name_and_state_id("Pittsburgh", s.id)

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
