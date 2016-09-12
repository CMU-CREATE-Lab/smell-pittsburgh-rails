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
  end


  # Get the previous AQI (usually previous hour) stored for a specific city
  def self.get_previous_aqi(city)
  end


  # Update the AQI that is stored for a specific city
  def self.update_aqi_for_city(city,aqi,timestamp=nil)
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
    category_for_aqi(get_previous_aqi("Pittsburgh")) < category_for_aqi(get_current_aqi("Pittsburgh"))
  end


  # Return true if pittsburgh's current AQI is lower than it was before
  def self.pittsburgh_aqi_category_decreased?
    category_for_aqi(get_previous_aqi("Pittsburgh")) > category_for_aqi(get_current_aqi("Pittsburgh"))
  end

end
