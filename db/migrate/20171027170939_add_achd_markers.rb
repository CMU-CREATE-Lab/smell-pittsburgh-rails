class AddAchdMarkers < ActiveRecord::Migration
  def up
    markers = [
      [
        {"name":"County AQ Monitor - Liberty","sensors":{"wind_speed":{"sources":[{"feed":28,"channel":"SONICWS_MPH"}]},"wind_direction":{"sources":[{feed:28,"channel":"SONICWD_DEG"}]},"PM25":{"sources":[{"feed":29,"channel":"PM25_UG_M3"},{"feed":29,"channel":"PM25T_UG_M3"}]}}},
        40.32377,
        -79.86806
      ],
      [
        {"name":"County AQ Monitor - Lawrenceville","sensors":{"wind_speed":{"sources":[{"feed":26,"channel":"SONICWS_MPH"}]},"wind_direction":{"sources":[{"feed":26,"channel":"SONICWD_DEG"}]},"PM25":{"sources":[{"feed":26,"channel":"PM25B_UG_M3"}]}}},
        40.46542,
        -79.960757
      ],
      [
        {"name":"County AQ Monitor - Parkway East","sensors":{"wind_speed":{"sources":[{"feed":43,"channel": "SONICWS_MPH"}]},"wind_direction":{"sources":[{"feed":43,"channel":"SONICWD_DEG"}]},"PM25":{"sources":[{"feed":5975,"channel":"PM2_5"}]}}},
        40.43743,
        -79.86357
      ],
      [
        {"name":"County AQ Monitor - Avalon","sensors":{"wind_speed":{"sources":[{"feed":1,"channel":"SONICWS_MPH"}]},"wind_direction":{"sources":[{"feed":1,"channel":"SONICWD_DEG"}]},"PM25":{"sources":[{"feed":1,"channel":"PM25B_UG_M3"},{"feed":1,"channel":"PM25T_UG_M3"}]}}},
        40.49977,
        -80.07134
      ],
      [
        {"name":"County AQ Monitor - Lincoln","sensors":{"PM25":{"sources":[{"feed":30,"channel":"PM25_UG_M3"}]}}},
        40.30822,
        -79.86913
      ]
    ]
    markers.each do |item|
      m = MapMarker.new
      m.region_id = 1
      m.marker_type = "esdr_feed"
      m.data = item[0].to_json
      m.latitude = item[1]
      m.longitude = item[2]
      m.save!
    end
  end
end
