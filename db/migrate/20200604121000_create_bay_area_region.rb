class CreateBayAreaRegion < ActiveRecord::Migration
  def change

    r = Region.new
    r.name = "Bay Area"
    r.description = "Selected Bay Area zip codes"
    r.latitude = 38.017810
    r.longitude = -122.259395
    r.zoom_level = 10

    cities = [
      {
        "name" => "Richmond",
        "zipcodes" =>  ["94801", "94850", "94804", "94805", "94803", "94806", "94530", "94564"],
      },
      {
        "name" => "Vallejo",
        "zipcodes" =>  ["94503", "94589", "94590", "94591", "94592"],
      },
      {
        "name" => "Benicia",
        "zipcodes" =>  ["94510"],
      },
      {
        "name" => "Crockett",
        "zipcodes" =>  ["94525"],
      },
      {
        "name" => "Hercules",
        "zipcodes" =>  ["94547"],
      },
      {
        "name" => "Martinez",
        "zipcodes" =>  ["94553"],
      },
      {
        "name" => "Port Costa",
        "zipcodes" =>  ["94569"],
      },
      {
        "name" => "Rodeo",
        "zipcodes" =>  ["94572", "94547"],
      },
    ]

    all_zips = []
    cities.each do |city|
      all_zips << city['zipcodes']
    end
    all_zips.flatten!

    r.zip_codes.push( all_zips.map{|i| ZipCode.find_or_create_by(:zip => i)} )
    r.save!

  end
end
