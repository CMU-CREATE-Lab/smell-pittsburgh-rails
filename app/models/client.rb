class Client < ActiveRecord::Base
  has_many :smell_reports
  validates :name, :description, :presence => true
end
