class Client < ActiveRecord::Base
  validates :name, :hash_prefix, :presence => true
end
