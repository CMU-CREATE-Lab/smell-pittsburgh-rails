Rails.application.routes.draw do

  post "/api/v1/smell_reports" => "api#smell_report_create"
  get "/api/v1/smell_reports" => "api#smell_report_index"
  get "/api/v1/get_aqi" => "api#get_aqi"
  get "/visualization" => "visualization#index"
  get "/summary" => "summary#index"

end
