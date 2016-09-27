class BannedUserHash < ActiveRecord::Base

  # user_hash :string

  validates :user_hash, :presence => true
  validates :user_hash, :uniqueness => {:case_sensitive => false}

end
