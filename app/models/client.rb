class Client < ActiveRecord::Base

  # TODO add a field for notes about a client (not exposed to API)
  has_many :smell_reports

  # TODO how do we associate smell_reports with clients?
  # - default smellpgh (but phase out of this eventually and perform validation with prefix)
  validates :name, :hash_prefix, :presence => true
  validates :hash_prefix, :uniqueness => true
end
