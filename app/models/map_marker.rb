class MapMarker < ActiveRecord::Base
  belongs_to :region
  validates :region, :presence => true
  validates :latitude, :longitude, :data, :presence => true
end
