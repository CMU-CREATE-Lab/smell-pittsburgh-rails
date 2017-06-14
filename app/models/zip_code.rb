class ZipCode < ActiveRecord::Base
  has_many :smell_reports
  validates :zip, :presence => true, :uniqueness => true
end
