class Region < ActiveRecord::Base
  has_and_belongs_to_many :zip_codes
  has_many :map_markers
  validates :latitude, :longitude, :zoom_level, :name, :presence => true
  validates :name, :uniqueness => true
end
