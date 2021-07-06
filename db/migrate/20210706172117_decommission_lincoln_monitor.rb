class DecommissionLincolnMonitor < ActiveRecord::Migration
  def up
    markers = [
      [
        {"name":"County AQ Monitor - Lincoln"},
        40.3082,
        -79.8691
      ]

    ]
   markers.each do |item|
      m = City.find_by_name("Pittsburgh").map_markers.where("latitude LIKE ? AND longitude LIKE ?", item[1], item[2]).first
      m.decommissioned_date = 1608181200000
      m.save!
    end
  end
end