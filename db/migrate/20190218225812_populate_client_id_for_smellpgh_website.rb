class PopulateClientIdForSmellpghWebsite < ActiveRecord::Migration
  def up
    Client.reset_column_information
    time = Time.now.to_i.to_s
    token = Digest::MD5.hexdigest time+rand.to_s
    client = Client.new
    client.id = 4
    client.name = "Smell Pittsburgh Website"
    client.description = "Website for Smell Pittsburgh."
    client.secret_token = token
    client.website = "https://smellpgh.org"
    client.save!
  end
end
