class PopulateClientIdForSmellReports < ActiveRecord::Migration
  def up
    smellpgh = Client.new
    smellpgh.id = CLIENT_ID_SMELLPGH
    smellpgh.name = "Smell Pittsburgh"
    smellpgh.description = "Cordova application targeted at iOS and Android platforms."
    smellpgh.save!
    bayarea = Client.new
    bayarea.id = CLIENT_ID_BA
    bayarea.name = "Air Watch: Bay Area"
    bayarea.description = "Fork of Smell PGH code base used in the Bay Area for reporting smells; makes use of 'additional_comments' field in SmellReport to add their own custom fields."
    bayarea.save!
    SmellReport.all.each do |report|
      report.determine_client_for_deprecated_apis
      report.save
    end
  end
end
