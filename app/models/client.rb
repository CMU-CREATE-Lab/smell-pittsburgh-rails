class Client < ActiveRecord::Base
  has_many :smell_reports
  validates :name, :description, :secret_token, :presence => true
  validates :secret_token, :uniqueness => true
end
