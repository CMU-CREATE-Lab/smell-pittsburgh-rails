class EmailSubscription < ActiveRecord::Base
  validates :email, :uniqueness => true
end
