class SmellReport < ActiveRecord::Base

  # user_hash :string
  # latitude :float
  # longitude :float
  # smell_value :integer
  # smell_description :text
  # feelings_symptoms :text
  # submit_achd_form :boolean
  # additional_comments :text
  # observed_at :datetime
  # custom_time :boolean
  # custom_location :boolean
  # street_name :string(20)

  belongs_to :zip_code

  validates :user_hash, :latitude, :longitude, :smell_value, :presence => true
  validates :smell_value, :inclusion => { in: (1..5) }

  before_create :generate_perturbed_coordinates
  after_destroy :handle_destroy

  scope :in_pittsburgh, -> { where("real_latitude < 40.916992 AND real_latitude > 40.102992 AND real_longitude < -79.428193 AND real_longitude > -80.471694") }
  scope :in_bay_area, -> { where("real_latitude < 38.8286208 AND real_latitude > 36.906913 AND real_longitude < -121.209588 AND real_longitude > -123.017998")}
  scope :from_app, ->(area) { where("user_hash REGEXP BINARY ?", area == "PGH" ? "^[^A-Z]" : "^"+area) }


  def self.is_within_pittsburgh?(latitude,longitude)
    return false if latitude.nil? or longitude.nil?
    latitude < 40.916992 and latitude > 40.102992 and longitude < -79.428193 and longitude > -80.471694
  end


  def is_within_pittsburgh?
    SmellReport.is_within_pittsburgh?(self.real_latitude,self.real_longitude)
  end


  def self.is_within_bay_area?(latitude,longitude)
    return false if latitude.nil? or longitude.nil?
    latitude < 37.995264 and latitude > 37.071794 and longitude < -121.570188 and longitude > -122.399811
  end


  def is_within_bay_area?
    SmellReport.is_within_bay_area?(self.real_latitude,self.real_longitude)
  end


  def self.perturbLatLng(lat, lng)
    perturb_miles = 0.10
    one_deg_of_lat_to_miles = 69
    one_deg_of_lng_to_miles = Math.cos(lat*Math::PI/180)*69
    lat_offset = (rand()*2 - 1)*perturb_miles / one_deg_of_lat_to_miles
    lng_offset = (rand()*2 - 1)*perturb_miles / one_deg_of_lng_to_miles
    return {"lat" => lat.to_f + lat_offset.to_f, "lng" => lng.to_f + lng_offset.to_f}
  end


  def generate_perturbed_coordinates
    if self.real_latitude.nil? and self.real_longitude.nil?
      self.real_latitude = self.latitude
      self.real_longitude = self.longitude
      coordinates = SmellReport.perturbLatLng(self.real_latitude,self.real_longitude)
      self.latitude = coordinates["lat"]
      self.longitude = coordinates["lng"]
      return true
    end
    return false
  end


  def self.aggregate_by_month(active_record)
    if active_record.empty?
      return {:month => [], :count => []}
    end
    tmp = active_record.group("year(created_at)")
    tmp = tmp.group("month(created_at)")
    tmp = tmp.count
    return {:month => tmp.keys, :count => tmp.values}
  end


  def self.aggregate_by_day(active_record, timezone_offset=nil)
    if active_record.empty?
      return {:day => [], :count => []}
    end
    offset_str = "+00:00"
    if timezone_offset
      a = timezone_offset.to_i
      # Convert the timezone offset returned from JavaScript
      # to a string for ruby's localtime method
      timezone_sign = ((a <=> 0) ? "-" : "+").to_s # reverse the sign
      timezone_hr = (a.abs/60).to_s.rjust(2, "0") # get the hour part
      timezone_min = (a.abs%60).to_s.rjust(2, "0") # get the minute part
      offset_str = timezone_sign + timezone_hr + ":" + timezone_min
    end
    reports = active_record.group("date(convert_tz(created_at,'+00:00','" + offset_str+ "'))").count
    return {:day => reports.keys, :count => reports.values}
  end


  def self.aggregate_by_day_and_smell_value(active_record, timezone_offset=nil)
    if active_record.empty?
      return {:day_and_smell_value => [], :count => []}
    end
    offset_str = "+00:00"
    if timezone_offset
      a = timezone_offset.to_i
      # Convert the timezone offset returned from JavaScript
      # to a string for ruby's localtime method
      timezone_sign = ((a <=> 0) ? "-" : "+").to_s # reverse the sign
      timezone_hr = (a.abs/60).to_s.rjust(2, "0") # get the hour part
      timezone_min = (a.abs%60).to_s.rjust(2, "0") # get the minute part
      offset_str = timezone_sign + timezone_hr + ":" + timezone_min
    end
    reports = active_record.group("date(convert_tz(created_at,'+00:00','" + offset_str+ "'))", "smell_value").count
    return {:day_and_smell_value => reports.keys, :count => reports.values}
  end


  def handle_destroy
    AchdForm.where(:smell_report_id => self.id).each do |form|
      form.destroy
    end
  end


  # WARNING: Do not use this unless you have good reason to!
  # This exposes the raw lat/long coordinates that were submitted
  # by the user. NEVER use this for general public use (e.g. on maps)
  def get_real_coordinates
    { longitude: real_longitude,latitude: real_latitude }
  end

end
