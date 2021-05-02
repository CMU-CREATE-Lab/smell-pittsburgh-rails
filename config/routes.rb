Rails.application.routes.draw do

  # old API
  post "/api/v1/smell_reports" => "api#smell_report_create"
  get "/api/v1/smell_reports" => "api#smell_report_index"
  get "/api/v1/get_aqi" => "api#get_aqi"

  # new API
  post "/api/v2/smell_reports" => "api#smell_report_create_api2"
  get "/api/v2/regions" => "api#regions_index"
  get "/api/v2/regions/:id" => "api#regions_show"
  get "/api/v2/regions/:id/map_markers" => "api#regions_map_markers"
  get "/api/v2/regions/:id/zip_codes" => "api#regions_zip_codes"

  get "/api/v2/cities" => "api#cities_index"
  get "/api/v2/cities/hashes" => "api#cities_hashes"
  get "/api/v2/cities/:id" => "api#cities_show"
  get "/api/v2/cities/:id/map_markers" => "api#cities_map_markers"
  get "/api/v2/cities/:id/zip_codes" => "api#cities_zip_codes"

  get "/api/v2/zip_codes" => "api#zip_codes"
  get "/api/v2/clients" => "api#clients_index"
  get "/api/v2/smell_reports" => "api#smell_reports_index_api2"

  get "/api/v2/get_aqi" => "api#get_aqi"
  get "/api/v2/get_city_by_zip" => "api#get_city_by_zip"
  get "/api/v2/get_location_info_by_zip" => "api#get_location_info_by_zip"

  get "/visualization" => "visualization#index"
  get "/summary" => "summary#index"

  get "/firebase/test" => "firebase#test"
  get "/firebase/notification/#{NOTIFICATION_URL_HASH}" => "firebase#send_notification"

end
