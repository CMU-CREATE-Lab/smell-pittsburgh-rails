namespace :airnow_aqi do


  task :request => :environment do
    cities = AqiTracker.cities

    # check/update pittsburgh first
    pittsburgh = cities[0]
    # we need to track whether or not pittsburgh's aqi was actually updated
    pittsburgh_aqi_updated = AirnowAqi.update_city_aqi(pittsburgh)

    # now, check/update the rest of the cities
    cities[1..-1].each do |city|
      AirnowAqi.update_city_aqi(city)
    end

    # # skip all of this if AirNow never actually updated pittsburgh's AQI
    # if pittsburgh_aqi_updated
    #   AqiTracker.track_pghaqi_change
    # end

    # AQI not-good alert
    AqiTracker.track_pghaqi_notgood
  end

end
