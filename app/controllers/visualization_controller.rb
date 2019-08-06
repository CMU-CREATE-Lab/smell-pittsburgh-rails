class VisualizationController < ApplicationController

  def index
    response.headers.delete('X-Frame-Options')

    pgh = City.find(1)
    latLng = params["latLng"].blank? ? [] : params["latLng"].split(",")
    zipCode = params["zipCode"]
    clientToken = params["client_token"].blank? ? "" : params["client_token"]
    client = Client.find_by_secret_token(clientToken) || Client.first

    if latLng.size == 2
      # latLng is the GPS user location, passed from the app
      @latitude = latLng[0]
      @longitude = latLng[1]
    end

    if zipCode
      zip_code = ZipCode.find_by_zip(zipCode)
      @city = zip_code.cities.first if zip_code
    elsif latLng.size == 2
      # request reverse geocode object
      geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{@latitude}, #{@longitude}" )
      zip_code = ZipCode.find_or_create_by(zip: geo.zip)
      @city = zip_code.cities.first
    end

    @client_id = client.id

    # All participating citites
    @cities = City.all
    # Manually add state code to each city object to be used on the visualization page.
    # Cities already contain a reference to the state id, but not the literal state code string.
    @cities.each do |city|
      city.state_code = State.find_by_id(city.state_id).state_code
    end
    @cities = @cities.to_json(:methods => [:state_code], :except => [:created_at, :updated_at, :app_metadata, :description, :state_id]).html_safe

    if @client_id == CLIENT_ID_SMELLPGH or @client_id == CLIENT_ID_SMELLPGHWEBSITE
      @zoom = pgh.zoom_level
      @city = pgh
    elsif @city
      @zoom = @city.zoom_level
    else
      @city = {}
    end

    @city.state_code = State.find_by_id(@city.state_id).state_code unless @city.blank?
    @city = @city.to_json(:methods => [:state_code], :except => [:created_at, :updated_at, :app_metadata, :description, :state_id]).html_safe

    # Defaults. Many of these will be ignored depending upon the client used
    @zoom = 11 unless @zoom
    @latitude = pgh.latitude unless @latitude
    @longitude = pgh.longitude unless @longitude
  end
end
