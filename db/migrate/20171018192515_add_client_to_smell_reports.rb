class AddClientToSmellReports < ActiveRecord::Migration
  def change
    add_reference :smell_reports, :client, index: true, foreign_key: true
  end
end
