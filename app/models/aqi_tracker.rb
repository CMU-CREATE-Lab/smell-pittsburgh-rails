class AqiTracker < ActiveRecord::Base

  def self.epa_aqi_scale
    [
      {
        "index" => 0,
        "name" => "Good",
        "max" => 50
      },
      {
        "index" => 1,
        "name" => "Moderate",
        "max" => 100
      },
      {
        "index" => 2,
        "name" => "Unhealthy for Sensitive Groups",
        "max" => 150
      },
      {
        "index" => 3,
        "name" => "Unhealthy",
        "max" => 200
      },
      {
        "index" => 4,
        "name" => "Very Unhealthy",
        "max" => 300
      },
      {
        "index" => 5,
        "name" => "Hazardous",
        "max" =>  500
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
      },
      {
        "name" => "Louisville",
        "zipcode" => "40202"
      }
    ]
  end


  # Get the most recent AQI stored for a specific city
  def self.get_current_aqi(city)
	zipcode = city["zipcode"]
	if Rails.cache.read("current_aqi_#{zipcode}").blank?
		return 0
	end
	return Rails.cache.read("current_aqi_#{zipcode}")[0]
  end

  #Get the most recent AQI stored for a specific zipcode
  def self.get_current_aqi_zip(zip)
	if Rails.cache.read("current_aqi_"+zip).blank?
      return 0
    end
	return Rails.cache.read("current_aqi_"+zip)[0]
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
      Rails.cache.write("previous_aqi_#{zipcode}",[get_current_aqi(city),current_timestamp])
      #Rails.cache.write("previous_timestamp_#{zipcode}",current_timestamp)
      Rails.cache.write("current_aqi_#{zipcode}",[aqi,timestamp])
      #Rails.cache.write("current_timestamp_#{zipcode}",timestamp)
      return true
    end
    return false
  end


  # Return the AQI category for a given AQI
  def self.category_for_aqi(aqi)
    epa_aqi_scale.each do |category|
      return category if aqi <= category["max"]
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


  # track if pittsburgh's AQI has changed AQI categories since its last two readings
  def self.track_pghaqi_change
    pittsburgh = cities[0]
    if pittsburgh_aqi_category_increased?
      Rails.logger.info("airnow_aqi:request(#{Time.now.to_i}): sending increased AQI push notification with cities #{cities_with_aqi_better_than_pittsburgh}")
      FirebasePushNotification.push_aqi_pittsburgh_change(true,cities_with_aqi_better_than_pittsburgh,pittsburgh)
    elsif pittsburgh_aqi_category_decreased?
      Rails.logger.info("airnow_aqi:request(#{Time.now.to_i}): sending decreased AQI push notification")
      FirebasePushNotification.push_aqi_pittsburgh_change(false,[],pittsburgh)
    end
  end


  # track if pittsburgh had bad AQI for 2 hours or more
  def self.track_pghaqi_notgood
    # the AQI category
    pgh_category = category_for_aqi(get_current_aqi(cities[0]))["index"]
    # the last time PGH was green
    from_time = get_green_timestamp
    # time of PGH's most recent AQI reading
    to_time = get_current_timestamp(cities[0])

    if pgh_category == 0
      set_green_timestamp(to_time)
      waiting_for_notgood_aqi(true)
      # we only send a notification if we were waiting for it to be green again
      if is_waiting_for_green?
        waiting_for_green(false)
        FirebasePushNotification.push_aqi_pittsburgh_green
      end
    elsif is_waiting_for_notgood_aqi? and (to_time - from_time >= 7200)
      FirebasePushNotification.push_aqi_pittsburgh_notgood
      waiting_for_notgood_aqi(false)
      waiting_for_green(true)
    end
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
    if Rails.cache.read("current_aqi_#{zipcode}").blank?
      return 0
    end
    return Rails.cache.read("current_aqi_#{zipcode}")[1]
  end


  def self.get_previous_timestamp(city)
    zipcode = city["zipcode"]
    if Rails.cache.read("previous_timestamp_#{zipcode}").blank?
      return 0
    end
    return Rails.cache.read("previous_timestamp_#{zipcode}")
  end


  # timestamp of the last time PGH AQI was green
  def self.get_green_timestamp
    if Rails.cache.read("pghaqi_green_timestamp").blank?
      Rails.cache.write("pghaqi_green_timestamp",0)
    end
    return Rails.cache.read("pghaqi_green_timestamp")
  end


  def self.set_green_timestamp(timestamp)
    Rails.cache.write("pghaqi_green_timestamp",timestamp)
  end


  # determines if we are still waiting to report notgood aqi
  def self.is_waiting_for_notgood_aqi?
    if Rails.cache.read("pghaqi_waiting_for_notgood_aqi").nil?
      Rails.cache.write("pghaqi_waiting_for_notgood_aqi",true)
    end
    return Rails.cache.read("pghaqi_waiting_for_notgood_aqi")
  end


  def self.waiting_for_notgood_aqi(flag)
    Rails.cache.write("pghaqi_waiting_for_notgood_aqi",flag)
  end


  def self.is_waiting_for_green?
    if Rails.cache.read("pghaqi_waiting_for_green").nil?
      Rails.cache.write("pghaqi_waiting_for_green",true)
    end
    return Rails.cache.read("pghaqi_waiting_for_green")
  end


  def self.waiting_for_green(flag)
    Rails.cache.write("pghaqi_waiting_for_green",flag)
  end

end
