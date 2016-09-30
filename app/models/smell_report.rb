class SmellReport < ActiveRecord::Base

  # user_hash :string
  # latitude :float
  # longitude :float
  # smell_value :integer
  # smell_description :text
  # feelings_symptoms :text
  # submit_achd_form :boolean
  # additional_comments :text

  validates :user_hash, :latitude, :longitude, :smell_value, :presence => true
  validates :smell_value, :inclusion => { in: (1..5) }
  before_create :generate_perturbed_coordinates

  scope :in_pittsburgh, -> { where("real_latitude < 40.916992 AND real_latitude > 40.102992 AND real_longitude < -79.428193 AND real_longitude > -80.471694") }


  def is_within_pittsburgh?
    return false if self.real_latitude.nil? or self.real_longitude.nil?
    self.real_latitude < 40.916992 and self.real_latitude > 40.102992 and self.real_longitude < -79.428193 and self.real_longitude > -80.471694
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

  # WARNING: Do not use this unless you have good reason to!
  # This exposes the raw lat/long coordinates that were submitted
  # by the user. NEVER use this for general public use (e.g. on maps)
  def get_real_coordinates
    { longitude: real_longitude,latitude: real_latitude }
  end

end
