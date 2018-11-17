class VisualizationController < ApplicationController

  def index
    response.headers.delete('X-Frame-Options')

    latLng = params["latLng"].blank? ? [] : params["latLng"].split(",")
    zipCode = params["zipCode"]
    clientToken = params["client_token"].blank? ? "" : params["client_token"]
    client = Client.find_by_secret_token(clientToken) || Client.first

    # Default to Pittsburgh
    pgh = City.find(1)
    @city = pgh
    @latitude = pgh.latitude
    @longitude = pgh.longitude
    @zoom = pgh.zoom_level

    if zipCode
      zip_code = ZipCode.find_by_zip(zipCode)
      @city = zip_code.cities.first if zipCode
    elsif latLng.size == 2
      # latLng is the GPS user location, passed from the app
      @latitude = latLng[0]
      @longitude = latLng[1]
      # request reverse geocode object
      geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{@latitude}, #{@longitude}" )
      zip_code = ZipCode.find_or_create_by(zip: geo.zip)
      @city = zip_code.cities.first
    end

    @client_id = client.id
    @city = @city.to_json(:except => [:created_at, :updated_at]).html_safe
    @cities = City.all.to_json(:except => [:created_at, :updated_at]).html_safe
  end

end
