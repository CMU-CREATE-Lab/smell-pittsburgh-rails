class PopulateClientIdForSmellReports < ActiveRecord::Migration
  def up
    time = Time.now.to_i.to_s
    token1 = Digest::MD5.hexdigest time+rand.to_s
    token2 = Digest::MD5.hexdigest time+rand.to_s
    smellpgh = Client.new
    smellpgh.id = CLIENT_ID_SMELLPGH
    smellpgh.name = "Smell Pittsburgh"
    smellpgh.description = "Cordova application targeted at iOS and Android platforms."
    smellpgh.secret_token = token1
    smellpgh.save!
    bayarea = Client.new
    bayarea.id = CLIENT_ID_BA
    bayarea.name = "Air Watch: Bay Area"
    bayarea.description = "Fork of Smell PGH code base used in the Bay Area for reporting smells; makes use of 'additional_comments' field in SmellReport to add their own custom fields."
    bayarea.secret_token = token2
    bayarea.save!
    SmellReport.all.each do |report|
      report.determine_client_for_deprecated_apis
      report.save
    end
  end
end
