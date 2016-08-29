namespace :airnow_aqi do


  task :request => :environment do
    # TODO list of cities
    cities = [
      {
        "name" => "pittsburgh",
        "zipcode" => "92241"
      }
    ]
    cities.each do |city|
      city.merge!({"values" => AirnowAqi.request_aqi_from_zipcode(city["zipcode"])})
      aqi = -1
      city["values"].each do |value|
        # we only care about pm2.5 and ozone
        if value["param"] == "PM2.5" or value["param"] == "O3"
          # a city's AQI is determined by the largest AQI of all parameters
          if value["value"] > aqi
            aqi = value["value"]
          end
        end
      end
      city["aqi"] = aqi
    end
    # check pittsburgh's aqi; if above 50, send push notifications
    pittsburgh = cities[0]
    if pittsburgh["aqi"] >= 50
      notifications = []
      # compare values of other cities against pittsburgh and push when pittsburgh is higher
      cities[1..-1].each do |city|
        if pittsburgh["aqi"] > city["aqi"]
          notifications.push(city["name"]) unless city["aqi"] == -1
        end
      end
      # TODO construct push notifications
      puts "Pittsburgh AQI is at/above 50; with cities higher than pgh: #{notifications}"
    else
      puts "Pittsburgh AQI is below 50; no notifications to be sent"
    end
  end

end