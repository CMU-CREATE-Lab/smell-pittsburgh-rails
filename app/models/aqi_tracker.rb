class AqiTracker < ActiveRecord::Base

  def self.epa_aqi_scale
    [
      {
        "index": 0,
        "name": "Good",
        "max": 50
      },
      {
        "index": 1,
        "name": "Moderate",
        "max": 100
      },
      {
        "index": 2,
        "name": "Unhealthy for Sensitive Groups",
        "max": 150
      },
      {
        "index": 3,
        "name": "Unhealthy",
        "max": 200
      },
      {
        "index": 4,
        "name": "Very Unhealthy",
        "max": 300
      },
      {
        "index": 5,
        "name": "Hazardous",
        "max": 500
      },
    ]
  end

  def self.cities
    [
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
  end


  # Get the most recent AQI stored for a specific city
  def self.get_current_aqi(city)
    zipcode = city["zipcode"]
    if Rails.cache.read("current_aqi_#{zipcode}").blank?
      return 0
    end
    return Rails.cache.read("current_aqi_#{zipcode}")
  end


  # Get the previous AQI (usually previous hour) stored for a specific city
  def self.get_previous_aqi(city)
    zipcode = city["zipcode"]
    if Rails.cache.read("previous_aqi_#{zipcode}").blank?
      return 0
    end
    return Rails.cache.read("previous_aqi_#{zipcode}")
  end


  # Update the AQI that is stored for a specific city
  def self.update_aqi_for_city(city,aqi,timestamp)
    zipcode = city["zipcode"]
    current_timestamp = get_current_timestamp(city)
    if current_timestamp < timestamp
      Rails.cache.write("previous_aqi_#{zipcode}",get_current_aqi(city))
      Rails.cache.write("previous_timestamp_#{zipcode}",current_timestamp)
      Rails.cache.write("current_aqi_#{zipcode}",aqi)
      Rails.cache.write("current_timestamp_#{zipcode}",timestamp)
      return true
    end
    return false
  end


  # Return the AQI category for a given AQI
  def self.category_for_aqi(aqi)
    epa_aqi_scale.each do |category|
      return category if aqi <= category[:max]
    end
    return nil
  end


  # Return a list of cities whose current AQI is in an AQI category lower than pittsburgh
  def self.cities_with_aqi_better_than_pittsburgh
    result = []
    pgh_category = category_for_aqi(get_current_aqi(cities[0]))["index"]

    cities[1..-1].each do |city|
      result.push(city) if category_for_aqi(get_current_aqi(city))["index"] < pgh_category
    end
    
    return result
  end


  # Return true if pittsburgh's current AQI has INCREASED
  def self.pittsburgh_aqi_category_increased?
    pittsburgh = cities[0]
    category_for_aqi(get_previous_aqi(pittsburgh))["index"] < category_for_aqi(get_current_aqi(pittsburgh))["index"]
  end


  # Return true if pittsburgh's current AQI has DECREASED
  def self.pittsburgh_aqi_category_decreased?
    pittsburgh = cities[0]
    category_for_aqi(get_previous_aqi(pittsburgh))["index"] > category_for_aqi(get_current_aqi(pittsburgh))["index"]
  end


  # for debugging purposes
  def self.info
    string = "[[city_name,current_aqi,current_timestamp,previous_aqi,previous_timestamp"
    cities.each do |city|
      string += "\n#{city["name"]},#{get_current_aqi(city)},#{get_current_timestamp(city)},#{get_previous_aqi(city)},#{get_previous_timestamp(city)}"
    end
    string += "]]"
  end


  private


  def self.get_current_timestamp(city)
    zipcode = city["zipcode"]
    if Rails.cache.read("current_timestamp_#{zipcode}").blank?
      return 0
    end
    return Rails.cache.read("current_timestamp_#{zipcode}")
  end


  def self.get_previous_timestamp(city)
    zipcode = city["zipcode"]
    if Rails.cache.read("previous_timestamp_#{zipcode}").blank?
      return 0
    end
    return Rails.cache.read("previous_timestamp_#{zipcode}")
  end

end
