class AddSubmitAchdFormToSmellReports < ActiveRecord::Migration
  def change
    add_column :smell_reports, :submit_achd_form, :boolean, :default => false
  end
end
