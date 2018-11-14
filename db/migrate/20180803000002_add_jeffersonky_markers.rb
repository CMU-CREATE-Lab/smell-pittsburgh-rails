class AddJeffersonkyMarkers < ActiveRecord::Migration
  def up
    markers = [
      [
        {"name":"Firearms Training AirNow","sensors":[{"PM10":{"sources":[{"feed":4175,"channel":"PM10"}]}},{"PM2_5":{"sources":[{"feed":4175,"channel":"PM2_5"}]}},{"SO2":{"sources":[{"feed":4175,"channel":"SO2"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"WATSON AirNow","sensors":[{"PM10":{"sources":[{"feed":2921,"channel":"PM10"}]}},{"PM2_5":{"sources":[{"feed":2921,"channel":"PM2_5"}]}},{"PM2_5":{"sources":[{"feed":2921,"channel":"PM2_5_daily_max"}]}},{"PM2_5":{"sources":[{"feed":2921,"channel":"PM2_5_daily_mean"}]}},{"PM2_5":{"sources":[{"feed":2921,"channel":"PM2_5_daily_median"}]}},{"SO2":{"sources":[{"feed":2921,"channel":"SO2"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"New Albany AirNow","sensors":[{"PM25":{"sources":[{"feed":2822,"channel":"PM2_5"}]}},{"PM2_5":{"sources":[{"feed":2822,"channel":"PM2_5_daily_max"}]}},{"PM2_5":{"sources":[{"feed":2822,"channel":"PM2_5_daily_mean"}]}},{"PM2_5":{"sources":[{"feed":2822,"channel":"PM2_5_daily_median"}]}},{"SO2":{"sources":[{"feed":2822,"channel":"SO2"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"PALouisville PurpleAir","sensors":[{"PM25":{"sources":[{"feed":16935,"channel":"PM2_5"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"Cannons Lane AirNow","sensors":[{"PM10":{"sources":[{"feed":2922,"channel":"PM10"}]}},{"PM2_5":{"sources":[{"feed":2922,"channel":"PM2_5"}]}},{"PM2_5":{"sources":[{"feed":2922,"channel":"PM2_5_daily_max"}]}},{"PM2_5":{"sources":[{"feed":2922,"channel":"PM2_5_daily_mean"}]}},{"PM2_5":{"sources":[{"feed":2922,"channel":"PM2_5_daily_median"}]}},{"SO2":{"sources":[{"feed":2922,"channel":"SO2"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"PALouisville B PurpleAir","sensors":[{"PM25":{"sources":[{"feed":16936,"channel":"PM2_5"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"Carrithers Middle School AirNow","sensors":[{"PM25":{"sources":[{"feed":15690,"channel":"PM2_5"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"Wyandotte Park AirNow","sensors":[{"PM10":{"sources":[{"feed":2920,"channel":"PM10"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"Southwick Community Center AirNow","sensors":[{"PM10":{"sources":[{"feed":2919,"channel":"PM10"}]}},{"PM2_5":{"sources":[{"feed":2919,"channel":"PM2_5"}]}},{"PM2_5":{"sources":[{"feed":2919,"channel":"PM2_5_daily_max"}]}},{"PM2_5":{"sources":[{"feed":2919,"channel":"PM2_5_daily_mean"}]}},{"PM2_5":{"sources":[{"feed":2919,"channel":"PM2_5_daily_median"}]}}]},
      38.188805,
      -85.6767705,
      ],
      [
        {"name":"BATES AirNow","sensors":[{"PM25":{"sources":[{"feed":2918,"channel":"PM2_5"}]}},{"PM2_5":{"sources":[{"feed":2918,"channel":"PM2_5_daily_max"}]}},{"PM2_5":{"sources":[{"feed":2918,"channel":"PM2_5_daily_mean"}]}},{"PM2_5":{"sources":[{"feed":2918,"channel":"PM2_5_daily_median"}]}}]},
      38.188805,
      -85.6767705,
      ]
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