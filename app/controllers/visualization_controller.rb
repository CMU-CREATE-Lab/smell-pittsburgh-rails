class VisualizationController < ApplicationController

  def index
    response.headers.delete('X-Frame-Options')

    latLng = params["latLng"].blank? ? [] : params["latLng"].split(",")
    pgh = Region.find(1)
    @regions = [pgh]
    @latitude = pgh.latitude
    @longitude = pgh.longitude
    @zoom = pgh.zoom_level
    if latLng.size == 2
      @latitude = latLng[0]
      @longitude = latLng[1]
      # request reverse geocode object
      geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{@latitude}, #{@longitude}" )
      @zipcode = geo.zip
      unless @zipcode.blank?
        zip_code = ZipCode.find_or_create_by(zip: @zipcode)
        @regions = zip_code.regions
      end
    end
  end


end
