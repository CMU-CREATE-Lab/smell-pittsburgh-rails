class AddJeffersonkyMarkers < ActiveRecord::Migration
  def up
    markers = [
      [{
        "name":"Firearms Training AirNow",
        "sensors":{
          "PM10":{"sources":[{"feed":4175,"channel":"PM10"}]},
          "PM25":{"sources":[{"feed":4175,"channel":"PM2_5"}]},
          "SO2":{"sources":[{"feed":4175,"channel":"SO2"}]},
        }},
        38.23158,
        -85.82675,
      ],
      [{
        "name":"WATSON AirNow",
        "sensors":{
          "PM10":{"sources":[{"feed":2921,"channel":"PM10"}]},
          "PM25":{"sources":[{"feed":2921,"channel":"PM2_5"}]},
          "SO2":{"sources":[{"feed":2921,"channel":"SO2"}]},
        }},
        38.0608,
        -85.8961,
      ],
      #[{
      #  "name":"New Albany AirNow",
      #  "sensors":{
      #    "PM25":{"sources":[{"feed":2822,"channel":"PM2_5"}]},
      #    "SO2":{"sources":[{"feed":2822,"channel":"SO2"}]},
      #  }},
      #  38.3081,
      #  -85.8342,
      #],
      [{
        "name":"PALouisville PurpleAir",
        "sensors":{
          "PM25":{"sources":[{"feed":16935,"channel":"PM2_5"}]},
        }},
        38.298912,
        -85.647063,
      ],
      [{
        "name":"Cannons Lane AirNow",
        "sensors":{
          "PM10":{"sources":[{"feed":2922,"channel":"PM10"}]},
          "PM25":{"sources":[{"feed":2922,"channel":"PM2_5"}]},
          "SO2":{"sources":[{"feed":2922,"channel":"SO2"}]},
        }},
        38.2286,
        -85.6544,
      ],
      [{
        "name":"PALouisville B PurpleAir",
        "sensors":{
          "PM25":{"sources":[{"feed":16936,"channel":"PM2_5"}]},
        }},
        38.298912,
        -85.647063,
      ],
      [{
        "name":"Carrithers Middle School AirNow",
        "sensors":{
          "PM25":{"sources":[{"feed":15690,"channel":"PM2_5"}]},
        }},
        38.1825,
        -85.5744,
      ],
      #[{
      #  "name":"Southwick Community Center AirNow",
      #  "sensors":{
      #    "PM10":{"sources":[{"feed":2919,"channel":"PM10"}]},
      #    "PM25":{"sources":[{"feed":2919,"channel":"PM2_5"}]},
      #  }},
      #  38.2317,
      #  -85.8156,
      #],
      #[{
      #  "name":"BATES AirNow",
      #  "sensors":{
      #    "PM25":{"sources":[{"feed":2918,"channel":"PM2_5"}]},
      #  }},
      #  38.1372,
      #  -85.5783,
      #]
    ]
   markers.each do |item|
      m = MapMarker.new
      m.region_id = 2
      m.marker_type = "esdr_feed"
      m.data = item[0].to_json
      m.latitude = item[1]
      m.longitude = item[2]
      m.save!
    end
  end
end