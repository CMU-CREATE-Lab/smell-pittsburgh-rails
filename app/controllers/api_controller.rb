class ApiController < ApplicationController

  # protect_from_forgery with: :null_session
  skip_before_action :verify_authenticity_token, :only => [:smell_report_create]

  # POST /api/v1/smell_reports
  #
  # PARAMS
  # "latitude" : Double
  # "longitude" : Double
  # "hash" : String
  # "smell_value" : Integer
  # "smell_description" : String
  # "feelings_symptoms" : String
  #
  def smell_report_create
    # render :inline => "smell_report_create"
    latitude = params["latitude"]
    longitude = params["longitude"]
    hash = params["hash"]
    smell_value = params["smell_value"]
    smell_description = params["smell_description"]
    feelings_symptoms = params["feelings_symptoms"]

    smell_report = SmellReport.new
    # TODO consruct smell report; model should check and only save for mandatory fields
    smell_report.save

    response = {
      :latitude => latitude,
      :longitude => longitude,
      :hash => hash,
      :smell_value => smell_value,
      :smell_description => smell_description,
      :feelings_symptoms => feelings_symptoms
    }

    render :json => response, :layout => false
  end


  # GET /api/v1/smell_reports
  #
  # PARAMS: none
  #
  def smell_report_index
    render :inline => "smell_report_index"
  end


  # remove me later
  def post_crash
    # never executes unless :post_crash is added to "skip_before_action"
    render :inline => "this crashes because protect from forgery"
  end

end
