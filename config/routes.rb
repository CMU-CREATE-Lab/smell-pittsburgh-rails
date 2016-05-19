Rails.application.routes.draw do

  post "/api/v1/smell_reports" => "api#smell_report_create"
  get "/api/v1/smell_reports" => "api#smell_report_index"
  get "/visualization" => "visualization#index"
  
end
