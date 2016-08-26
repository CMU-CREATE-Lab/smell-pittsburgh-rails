namespace :airnow_aqi do


  task :request => :environment do
    # TODO list of cities
    cities = [
      {
        :name => "pittsburgh",
        :zipcode => "15201"
      }
    ]
    cities.each do |city|
      city.merge!({:values => AirnowAqi.request_aqi_from_zipcode(city["zipcode"])})
    end
    # TODO check values for pittsburgh and push when within threshold
    # TODO compare values of other cities against pittsburgh and push when pittsburgh is higher
  end

end