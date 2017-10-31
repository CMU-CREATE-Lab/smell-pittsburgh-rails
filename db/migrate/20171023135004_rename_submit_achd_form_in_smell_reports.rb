class RenameSubmitAchdFormInSmellReports < ActiveRecord::Migration
  def change
    rename_column :smell_reports, :submit_achd_form, :send_form_to_agency
  end
end
