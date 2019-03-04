class CreateTimeZoneTable < ActiveRecord::Migration
  def change
    create_table :time_zones do |t|
      t.string :time_zone

      t.timestamps null: false
    end
  end
end
