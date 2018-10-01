class PopulateClientSmellMyCity < ActiveRecord::Migration
  def up
    time = Time.now.to_i.to_s
    token1 = Digest::MD5.hexdigest time+rand.to_s
    smc = Client.new
    smc.name = "Smell MyCity"
    smc.description = "Cordova application targeted at iOS and Android platforms. Supports reporting across the US."
    smc.secret_token = token1
    smc.save!
  end
end
