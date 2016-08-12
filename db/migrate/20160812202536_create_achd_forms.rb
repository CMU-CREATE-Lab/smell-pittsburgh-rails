class CreateAchdForms < ActiveRecord::Migration
  def change
    create_table :achd_forms do |t|
      t.string :email
      t.string :phone
      t.string :name
      t.references :smell_report, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
