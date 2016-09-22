namespace :airnow_aqi do


  task :request => :environment do
    cities = AqiTracker.cities
    # check pittsburgh first
    pittsburgh = cities[0]
    values = AirnowAqi.request_aqi_from_zipcode(pittsburgh["zipcode"])
    aqi = -1
    date = 0
    values.each do |value|
      # we only care about pm2.5 and ozone
      if value["param"] == "PM2.5" or value["param"] == "O3"
        # a city's AQI is determined by the largest AQI of all parameters
        if value["value"] > aqi
          aqi = value["value"]
          date = value["date"]
        end
      end
    end
    # we need to track whether or not pittsburgh's aqi was actually updated
    pittsburgh_aqi_updated = (aqi >= 0 and AqiTracker.update_aqi_for_city(pittsburgh,aqi,date))
    # now, check the rest
    cities[1..-1].each do |city|
      values = AirnowAqi.request_aqi_from_zipcode(city["zipcode"])
      aqi = -1
      date = 0
      values.each do |value|
        # we only care about pm2.5 and ozone
        if value["param"] == "PM2.5" or value["param"] == "O3"
          # a city's AQI is determined by the largest AQI of all parameters
          if value["value"] > aqi
            aqi = value["value"]
            date = value["date"]
          end
        end
      end
      AqiTracker.update_aqi_for_city(city,aqi,date) unless aqi < 0
    end

    # skip all of this if AirNow never actually updated pittsburgh's AQI
    if pittsburgh_aqi_updated
      if AqiTracker.pittsburgh_aqi_category_increased?
        Rails.logger.info("airnow_aqi:request(#{Time.now.to_i}): sending increased AQI push notification with cities #{AqiTracker.cities_with_aqi_better_than_pittsburgh}")
        FirebasePushNotification.push_aqi_pittsburgh(true,AqiTracker.cities_with_aqi_better_than_pittsburgh,pittsburgh)
      elsif AqiTracker.pittsburgh_aqi_category_decreased?
        Rails.logger.info("airnow_aqi:request(#{Time.now.to_i}): sending decreased AQI push notification")
        FirebasePushNotification.push_aqi_pittsburgh(false,[],pittsburgh)
      end
    end
  end

end
