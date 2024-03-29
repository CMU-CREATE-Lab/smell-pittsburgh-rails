class EmailSubscription < ActiveRecord::Base

  validates :email, :uniqueness => true
  # TODO confirm formatting?
  validates_format_of :email, :with => /\A(\S+)@(.+)\.(\S+)\z/
  validates :token_to_unsubscribe, :uniqueness => true

  before_create :generate_token_to_unsubscribe


  # static variable avoids duplicate UIDs being created at same time
  @@uid_iterator = 0

  def self.uid_iterator
    @@uid_iterator
  end

  private
    def generate_token_to_unsubscribe
      @@uid_iterator = (@@uid_iterator + 1) % 1000
      self.token_to_unsubscribe = Digest::MD5.hexdigest("#{@@uid_iterator}-#{Time.now.to_i}")
    end
end
