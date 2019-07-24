class City < ActiveRecord::Base
  has_and_belongs_to_many :zip_codes
  has_and_belongs_to_many :regions
  belongs_to :state
  has_many :map_markers
  validates :latitude, :longitude, :zoom_level, :name, :presence => true
  validates :name, :uniqueness => true
  serialize :app_metadata
  attr_accessor :state_code
end
