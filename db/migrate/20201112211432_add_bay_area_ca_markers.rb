class AddBayAreaCaMarkers < ActiveRecord::Migration
  def up
    markers = [
      [{
        "name":"San Rafael Air Now",
        "sensors":{"PM25":{"sources":[{"feed":2411,"channel":"PM2_5"}]}}
        },
        37.9722,
        -122.5189
      ],
      [{
        "name":"Sonoma Baylands AirNow",
        "sensors":{"wind_speed":{"sources":[{"feed":2525,"channel": "WS"}]},"wind_direction":{"sources":[{"feed":2525,"channel":"WD"}]}}
        },
        38.13161,
        -122.47467
      ],
      [{
        "name":"Fairfield AirNow",
        "sensors":{"wind_speed":{"sources":[{"feed":2519,"channel": "WS"}]},"wind_direction":{"sources":[{"feed":2519,"channel":"WD"}]}}
        },
        38.227066,
        -122.075624
      ],
      [{
        "name":"Napa AirNow",
        "sensors":{"wind_speed":{"sources":[{"feed":2430,"channel": "WS"}]},"wind_direction":{"sources":[{"feed":2430,"channel":"WD"}]},"PM25":{"sources":[{"feed":18204,"channel":"PM2_5"}]}}
        },
        38.2785,
        -122.27825
      ],
      [{
        "name":"Vallejo AirNow",
        "sensors":{"wind_speed":{"sources":[{"feed":2518,"channel": "WS"}]},"wind_direction":{"sources":[{"feed":2518,"channel":"WD"}]},"PM25":{"sources":[{"feed":2518,"channel":"PM2_5"}]}}
        },
        38.102507,
        -122.237976
      ],
      [{
        "name":"San Pablo - Rumrill AirNow",
        "sensors":{"PM25":{"sources":[{"feed":2357,"channel":"PM2_5"}]}}
        },
        37.9604,
        -122.3571
      ],
      [{
        "name":"Berkeley Aquatic Park AirNow",
        "sensors":{"PM25":{"sources":[{"feed":7072,"channel":"PM2_5"}]}}
        },
        37.864767,
        -122.302741
      ],
      [{
        "name":"San Francisco AirNow",
        "sensors":{"PM25":{"sources":[{"feed":2479,"channel":"PM2_5"}]}}
        },
        37.7658,
        -122.3978
      ],
      [{
        "name":"Oakland West AirNow",
        "sensors":{"PM25":{"sources":[{"feed":2343,"channel":"PM2_5"}]}}
        },
        37.8148,
        -122.282402
      ],
      [{
        "name":"Laney College AirNow",
        "sensors":{"PM25":{"sources":[{"feed":4203,"channel":"PM2_5"}]}}
        },
        37.793624,
        -122.263376
      ]
    ]

    s = State.find_by_state_code("CA")
    c = City.find_by_name_and_state_id("Bay Area", s.id)

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
