class AirnowAqi < ActiveRecord::Base


  def self.AIRNOW_API_URL
    "http://www.airnowapi.org"
  end


  def self.request_aqi_from_zipcode(zipcode)
    response = `curl "#{self.AIRNOW_API_URL}/aq/observation/zipCode/current/?format=application/json&zipCode=#{zipcode}&distance=25&API_KEY=#{AIRNOW_API_KEY}"`
    begin
      json = JSON.parse(response)
      results = []
      json.each do |row|
        # YYYY-MM-DD HH:00 EST => Unix time
        date = "#{row["DateObserved"]}#{row["HourObserved"]}:00 #{row["LocalTimeZone"]}".to_datetime.to_i
        param = row["ParameterName"]
        value = row["AQI"]

        # add row
        results.push( { "date" => date, "param" => param, "value" => value} )
      end
      return results
    rescue
      Rails.logger.info("AirnowAqi.request_aqi_from_zipcode Failed with zipcode=#{zipcode}")
      return []
    end
  end

end
