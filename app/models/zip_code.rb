class ZipCode < ActiveRecord::Base
  has_many :smell_reports
  has_and_belongs_to_many :regions
  has_and_belongs_to_many :cities
  validates :zip, :presence => true, :uniqueness => true
end
