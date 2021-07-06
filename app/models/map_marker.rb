class MapMarker < ActiveRecord::Base

  belongs_to :city

  validates :city, :latitude, :longitude, :data, :presence => true
  validate :data_in_valid_json_format


  def to_api
    model_json_string = self.to_json(:only => [:latitude, :longitude, :marker_type, :id, :decommissioned_date])
    return JSON(self.data).merge(JSON(model_json_string))
  end


  def data_in_valid_json_format
    begin
      JSON(self.data)
    rescue
      errors.add(:data, "Data is not in a valid JSON string format")
    end
  end

end
