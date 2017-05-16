class CreateZipCodes < ActiveRecord::Migration
  def change
    create_table :zip_codes do |t|
      t.string :zip, :limit => 10

      t.timestamps null: false
    end
  end
end
