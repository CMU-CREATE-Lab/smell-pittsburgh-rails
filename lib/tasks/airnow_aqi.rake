namespace :airnow_aqi do


  task :request => :environment do
    cities = [
      {
        "name" => "Pittsburgh",
        "zipcode" => "15213"
      },
      {
        "name" => "New York City",
        "zipcode" => "11224"
      },
      {
        "name" => "Boston",
        "zipcode" => "02210"
      },
      {
        "name" => "Cleveland",
        "zipcode" => "44115"
      },
      {
        "name" => "Chicago",
        "zipcode" => "60652"
      },
      {
        "name" => "Seattle",
        "zipcode" => "98195"
      },
      {
        "name" => "San Francisco",
        "zipcode" => "94117"
      },
      {
        "name" => "Washington DC",
        "zipcode" => "20001"
      },
      {
        "name" => "Denver",
        "zipcode" => "80201"
      },
      {
        "name" => "Columbus",
        "zipcode" => "43085"
      },
      {
        "name" => "Houston",
        "zipcode" => "77004"
      },
      {
        "name" => "Los Angeles",
        "zipcode" => "90001"
      },
      {
        "name" => "Philadelphia",
        "zipcode" => "19104"
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

    notifications = []
    # check pittsburgh's aqi; if above 50, send push notifications
    pittsburgh = cities[0]
    if pittsburgh["aqi"] > 50
      notifications.push(pittsburgh["name"])
    end
    # compare values of other cities against pittsburgh and push when pittsburgh is higher
    cities[1..-1].each do |city|
      # we only want to know when the AQI threshold differs (0-50 good, 51-100 moderate, etc.)
      if (pittsburgh["aqi"]-1)/50 > (city["aqi"]-1)/50
        notifications.push(city["name"]) unless city["aqi"] < 1
      end
    end

    # TODO construct push notifications
    puts "notifications to send: #{notifications}"
  end

end