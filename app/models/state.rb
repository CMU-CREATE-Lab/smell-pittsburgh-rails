class State < ActiveRecord::Base
  has_and_belongs_to_many :zip_codes
  has_and_belongs_to_many :cities
end
