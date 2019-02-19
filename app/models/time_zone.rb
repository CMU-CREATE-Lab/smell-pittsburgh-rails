class TimeZone < ActiveRecord::Base
  has_many :smell_reports
  validates :time_zone, :presence => true, :uniqueness => true
end
