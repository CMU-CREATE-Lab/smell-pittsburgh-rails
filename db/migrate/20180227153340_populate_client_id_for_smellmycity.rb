class PopulateClientIdForSmellmycity < ActiveRecord::Migration
  def up
    time = Time.now.to_i.to_s
    token = Digest::MD5.hexdigest time+rand.to_s
    smellmycity = Client.new
    smellmycity.id = CLIENT_ID_SMELLMYCITY
    smellmycity.name = "SmellMyCity"
    smellmycity.description = "Cordova application targeted at iOS and Android platforms."
    smellmycity.secret_token = token
    smellmycity.save!
    SmellReport.all.each do |report|
      report.determine_client_for_deprecated_apis
      report.save
    end
  end
end
