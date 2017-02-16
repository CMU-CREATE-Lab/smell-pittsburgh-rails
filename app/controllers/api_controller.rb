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
  # "horizontal_accuracy" : Double
  # "vertical_accuracy" : Double
  # "additional_comments" : String
  #   (specific to ACHD form submission)
  # "submit_achd_form" : Boolean
  # "email" : String
  # "name" : String
  # "phone_number" : String
  # "address" : String
  #
  def smell_report_create
    smell_report = SmellReport.new
    smell_report.latitude = params["latitude"].to_f unless params["latitude"].blank?
    smell_report.longitude = params["longitude"].to_f unless params["longitude"].blank?
    smell_report.user_hash = params["user_hash"] unless params["user_hash"].blank?
    smell_report.smell_value = params["smell_value"].to_i unless params["smell_value"].blank?
    smell_report.smell_description = params["smell_description"] unless params["smell_description"].blank?
    smell_report.feelings_symptoms = params["feelings_symptoms"] unless params["feelings_symptoms"].blank?
    smell_report.horizontal_accuracy = params["horizontal_accuracy"] unless params["horizontal_accuracy"].blank?
    smell_report.vertical_accuracy = params["vertical_accuracy"] unless params["vertical_accuracy"].blank?
    smell_report.additional_comments = params["additional_comments"] unless params["additional_comments"].blank?

    # by default, send to achd
    smell_report.submit_achd_form = true
    # override default when flag is present in API request
    smell_report.submit_achd_form = (params["submit_achd_form"].blank? ? false : true) unless params["submit_achd_form"].nil?
    # do not send to ACHD if the smell report is outside the pgh bounding box
    # TODO we should also check against a list of valid zipcodes for ACHD submission
    smell_report.submit_achd_form = false unless SmellReport.is_within_pittsburgh?(smell_report.latitude,smell_report.longitude)

    if BannedUserHash.where(:user_hash => smell_report.user_hash).size > 0
      Rails.logger.info("(ApiController::smell_report_create) ignoring smell report with banned user_hash=#{smell_report.user_hash}")
      # banned users
      response = {
        :error => "failed to create smell report from submitted form."
      }
    elsif smell_report.save
      # success
      response = {
        :latitude => smell_report.latitude,
        :longitude => smell_report.longitude,
        :user_hash => smell_report.user_hash,
        :smell_value => smell_report.smell_value,
        :smell_description => smell_report.smell_description,
        :feelings_symptoms => smell_report.feelings_symptoms,
        :additional_comments => smell_report.additional_comments,
        :horizontal_accuracy => smell_report.horizontal_accuracy,
        :vertical_accuracy => smell_report.vertical_accuracy
      }

      # send push notifications for smell values at or above 3
      if SmellReportTracker.is_listening_for_smell_reports? and smell_report.smell_value >= 3 and smell_report.is_within_pittsburgh?
        SmellReportTracker.set_last_reported(smell_report.created_at.to_i)
        SmellReportTracker.listening_for_smell_reports(false)
        SmellReportTracker.generating_hourly_summary(true)
        FirebasePushNotification.push_smell_report(smell_report)
      end

      # send push notifications for smell values at or above 3 in Bay Area
      if BASmellReportTracker.is_listening_for_smell_reports? and smell_report.smell_value >= 3 and smell_report.is_within_bay_area?
        BASmellReportTracker.set_last_reported(smell_report.created_at.to_i)
        BASmellReportTracker.listening_for_smell_reports(false)
        BASmellReportTracker.generating_hourly_summary(true)
        FirebasePushNotification.push_smell_report(smell_report,"BA")
      end

      # send email
      if smell_report.submit_achd_form
        options = {
          "reply_email": params["email"],
          "name": params["name"],
          "phone_number": params["phone_number"],
          "address": params["address"]
        }
        AchdForm.submit_form(smell_report,options)
      end
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
    timezone_offset = params["timezone_offset"]
    area = params["area"] == nil ? "PGH" : params["area"]
    min_smell_value = params["min_smell_value"] == nil ? 0 : params["min_smell_value"]

    if start_time
      start_datetime = Time.at(start_time.to_i).to_datetime if start_time
    else
      start_datetime = Time.at(SmellReport.first.created_at).to_datetime
    end

    if end_time
      end_datetime = Time.at(end_time.to_i + 1).to_datetime if end_time
    else
      end_datetime = Time.now.to_datetime
    end

    if aggregate == "month"
      # If aggregated by month
      reports = SmellReport.from_app(area).order('created_at ASC').group("year(created_at)").group("month(created_at)").count
      reports = {month: reports.keys}
    elsif aggregate == "day"
      # If aggregated by day
      reports = SmellReport.where(:created_at => start_datetime...end_datetime).where("smell_value>=" + min_smell_value.to_s).from_app(area).order('created_at ASC')
      reports_aggr = []
      offset_str = "+00:00"
      if timezone_offset
        a = timezone_offset.to_i
        # Convert the timezone offset returned from JavaScript
        # to a string for ruby's localtime method
        timezone_sign = ((a <=> 0) ? "-" : "+").to_s # reverse the sign
        timezone_hr = (a.abs/60).to_s.rjust(2, "0") # get the hour part
        timezone_min = (a.abs%60).to_s.rjust(2, "0") # get the minute part
        offset_str = timezone_sign + timezone_hr + ":" + timezone_min
      end
      start_datetime.to_date.upto(end_datetime.to_date).each do |date|
        date_str = date.to_s
        reports_aggr << [date_str, reports.select{|u| u["created_at"].utc.localtime(offset_str).to_date.to_s == date_str}.count]
        #Rails.logger.info(date.to_s)
      end
      reports = reports_aggr
    else
      # If not aggregated
      reports = SmellReport.where(:created_at => start_datetime...end_datetime).from_app(area).order('created_at ASC')
      # Select only some fields
      reports = reports.as_json(:only => [:latitude, :longitude, :smell_value, :smell_description, :feelings_symptoms, :created_at])
      # Convert created_at to epoch time
      for i in 0..reports.size()-1
        reports[i]["created_at"] = reports[i]["created_at"].to_i
      end
    end

    render :json => reports
  end

  # GET /api/v1/get_aqi
  #
  # PARAMS:
  # "city" : String
  def get_aqi
    @aqi = "null"
    AqiTracker.cities.each do |hash|
      if (hash.has_value?(params["city"]))
        val = AqiTracker.get_current_aqi(hash)
        @aqi = val
        break
      end
    end
    render :json => @aqi.to_json
  end
end
