class AirnowAqi < ActiveRecord::Base

  def self.AIRNOW_API_URL
    "http://www.airnowapi.org"
  end


  # makes a request for a city's AQI.
  # returns true if airnow has a more recent value than what we previously had
  # returns false otherwise
  def self.update_city_aqi(city)
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
    return false if aqi < 0
    return AqiTracker.update_aqi_for_city(city,aqi,date)
  end


  def self.request_aqi_from_zipcode(zipcode)
    # Need 'L' to follow redirects
    response = `curl -L "#{self.AIRNOW_API_URL}/aq/observation/zipCode/current/?format=application/json&zipCode=#{zipcode}&distance=25&API_KEY=#{AIRNOW_API_KEY}"`
    begin
      json = JSON.parse(response)
      results = []
      json.each do |row|
        # YYYY-MM-DD HH:00 EST => Unix time
        date = "#{row['DateObserved']} #{row['HourObserved']}:00 #{row['LocalTimeZone']}".to_datetime.to_i
        param = row["ParameterName"]
        value = row["AQI"]
        # add row
        results.push( { "date" => date, "param" => param, "value" => value} )
      end
      return results
    rescue Exception => e
      Rails.logger.info("AirnowAqi.request_aqi_from_zipcode Failed with zipcode=#{zipcode} from error #{e}")
      return []
    end
  end

end
