class CreateSmellReports < ActiveRecord::Migration
  def change
    create_table :smell_reports do |t|
      t.string :user_hash
      t.float :latitude
      t.float :longitude
      t.integer :smell_value
      t.text :smell_description
      t.text :feelings_symptoms

      t.timestamps null: false
    end
  end
end
