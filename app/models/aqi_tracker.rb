class AqiTracker < ActiveRecord::Base

  def self.epa_aqi_scale
    [
      {
        "name": "Good",
        "max": 50
      },
      {
        "name": "Moderate",
        "max": 100
      },
      {
        "name": "Unhealthy for Sensitive Groups",
        "max": 150
      },
      {
        "name": "Unhealthy",
        "max": 200
      },
      {
        "name": "Very Unhealthy",
        "max": 300
      },
      {
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


  # Return the index of the AQI category from the EPA scale
  def self.category_for_aqi(aqi)
    scale = epa_aqi_scale()
    scale.each_with_index do |category,index|
      return index if aqi <= category[:max]
    end
    return scale.length - 1
  end


  # Return a list of cities whose current AQI is in an AQI category lower than pittsburgh
  def self.cities_with_aqi_better_than_pittsburgh()
    result = []
    pgh_category = category_for_aqi(get_current_aqi(cities()[0]))

    cities()[1..-1].each_with_index do |city,index|
      result.push(city) if category_for_aqi(get_current_aqi(city)) < pgh_category
    end
    
    return result
  end


  # Return true if pittsburgh's current AQI is larger than it was before
  def self.pittsburgh_aqi_category_increased?
    category_for_aqi(get_previous_aqi(cities()[0])) < category_for_aqi(get_current_aqi(cities()[0]))
  end


  # Return true if pittsburgh's current AQI is lower than it was before
  def self.pittsburgh_aqi_category_decreased?
    category_for_aqi(get_previous_aqi(cities()[0])) > category_for_aqi(get_current_aqi(cities()[0]))
  end


  # for debugging purposes
  def self.info
    string = "[[city_name,current_aqi,current_timestamp,previous_aqi,previous_timestamp"
    cities().each do |city|
      string += "\n#{city["name"]},#{get_current_aqi(city)},#{get_current_timestamp(city)},#{get_previous_aqi(city)},#{get_previous_timestamp(city)}"
    end
    string += "]]"
  end

end
