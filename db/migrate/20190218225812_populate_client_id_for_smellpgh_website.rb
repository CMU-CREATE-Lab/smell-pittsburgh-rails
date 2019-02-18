class PopulateClientIdForSmellpghWebsite < ActiveRecord::Migration
  def up
    time = Time.now.to_i.to_s
    token = Digest::MD5.hexdigest time+rand.to_s
    client = Client.new
    client.id = 4
    client.name = "SmellMyPGHWebsite"
    client.description = "Website for Smell Pittsburgh."
    client.secret_token = token
    client.save!
  end
end
