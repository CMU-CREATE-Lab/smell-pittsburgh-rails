class ApiController < ApplicationController

  # protect_from_forgery with: :null_session
  skip_before_action :verify_authenticity_token, :only => [:smell_report_create]


  # POST /api/v1/smell_reports
  #
  # PARAMS
  # "latitude" : Double *
  # "longitude" : Double *
  # "user_hash" : String *
  # "smell_value" : Integer *
  # "smell_description" : String
  # "feelings_symptoms" : String
  #
  def smell_report_create
    smell_report = SmellReport.new
    smell_report.latitude = params["latitude"].to_f unless params["latitude"].blank?
    smell_report.longitude = params["longitude"].to_f unless params["longitude"].blank?
    smell_report.user_hash = params["user_hash"] unless params["user_hash"].blank?
    smell_report.smell_value = params["smell_value"].to_i unless params["smell_value"].blank?
    smell_report.smell_description = params["smell_description"] unless params["smell_description"].blank?
    smell_report.feelings_symptoms = params["feelings_symptoms"] unless params["feelings_symptoms"].blank?

    if smell_report.save
      # success
      response = {
        :latitude => smell_report.latitude,
        :longitude => smell_report.longitude,
        :user_hash => smell_report.user_hash,
        :smell_value => smell_report.smell_value,
        :smell_description => smell_report.smell_description,
        :feelings_symptoms => smell_report.feelings_symptoms
      }
    else
      # fail
      response = {
        :error => "failed to create smell report from submitted form."
      }
    end

    render :json => response, :layout => false
  end


  # GET /api/v1/smell_reports
  #
  # PARAMS: none
  #
  def smell_report_index
    start_time = params["start_time"]
    end_time = params["end_time"]
    aggregate = params["aggregate"]

    if start_time
      start_datetime = Time.at(start_time.to_i).to_datetime if start_time
    else
      start_datetime = Time.at(0).to_datetime
    end

    if end_time
      end_datetime = Time.at(end_time.to_i + 1).to_datetime if end_time
    else
      end_datetime = Time.now.to_datetime
    end

    @reports = SmellReport.where(:created_at => start_datetime...end_datetime)

    if aggregate
        @reports = @reports.sort_by{|r| r.created_at}
    end

    render :json => @reports.to_json(:only => [:latitude, :longitude, :smell_value, :smell_description, :feelings_symptoms, :created_at])
  end

end
