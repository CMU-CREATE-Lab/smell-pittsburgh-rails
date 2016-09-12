namespace :airnow_aqi do


  task :request => :environment do
    cities = AqiTracker.cities
    cities.each do |city|
      city.merge!({"values" => AirnowAqi.request_aqi_from_zipcode(city["zipcode"])})
      aqi = -1
      date = 0
      city["values"].each do |value|
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

    Rails.logger.info("airnow_aqi:request (RAKE-#{Time.now.to_i}): DATA FROM AIRNOW: #{cities}")
    Rails.logger.info("airnow_aqi:request (RAKE-#{Time.now.to_i}): DATA FROM RAILS CACHE: #{AqiTracker.info}")
    if AqiTracker.pittsburgh_aqi_category_increased?
      Rails.logger.info("airnow_aqi:request (RAKE-#{Time.now.to_i}): PGH AQI increased to #{}!")
    end
    if AqiTracker.pittsburgh_aqi_category_decreased?
      Rails.logger.info("airnow_aqi:request (RAKE-#{Time.now.to_i}): PGH AQI decreased to #{}!")
    end
    Rails.logger.info("airnow_aqi:request (RAKE-#{Time.now.to_i}): cities better than pgh: #{AqiTracker.cities_with_aqi_better_than_pittsburgh}")
  end

end
