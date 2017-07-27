require 'csv'

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
  # "custom_location" : Boolean
  #   - Specify that the location for the report was manually entered and is not from GPS
  # "custom_time" : Boolean
  #   - Specify that the time for the report was manually entered (observed_at) and is not the current time
  # "observed_at" : DateTime (RFC3339)
  # "submit_achd_form" : Boolean
  # "email" : String [FILTERED]
  # "name" : String [FILTERED]
  # "phone_number" : String [FILTERED]
  # "address" : String [FILTERED]
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

    # mark custom fields when included
    smell_report.custom_location = (not params["custom_location"].blank? and params["custom_location"] == "true") ? true : false
    smell_report.custom_time = (not params["custom_time"].blank? and params["custom_time"] == "true") ? true : false

    # determine smell report observed at time
    # string format: %Y-%m-%dT%H:%M:%S%:z
    smell_report.observed_at = DateTime.rfc3339(params["observed_at"]) unless params["observed_at"].blank?
    if smell_report.custom_time == false or smell_report.observed_at.blank?
      smell_report.observed_at = Time.now
      smell_report.custom_time = false
    end

    # by default, send to achd
    smell_report.submit_achd_form = true
    # override default when flag is present in API request
    smell_report.submit_achd_form = (params["submit_achd_form"].blank? ? false : true) unless params["submit_achd_form"].nil?
    # do not send to ACHD if the smell report is outside the pgh bounding box
    # TODO we should also check against a list of valid zipcodes for ACHD submission
    smell_report.submit_achd_form = false unless SmellReport.is_within_pittsburgh?(smell_report.latitude,smell_report.longitude)
    # request reverse geocode object
    geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{smell_report.latitude}, #{smell_report.longitude}" )
    # associate smell report with zip code
    unless geo.zip.blank?
      zip_code = ZipCode.find_or_create_by(zip: geo.zip)
      smell_report.zip_code_id = zip_code.id
    end
    # get the street name from reverse geocoding
    unless geo.street_name.blank?
      smell_report.street_name = geo.street_name
    end

    last_smell_report_from_user = SmellReport.where(user_hash: smell_report.user_hash).order("created_at").last
    # 5 seconds
    if (last_smell_report_from_user and (Time.now.to_i - last_smell_report_from_user.created_at.to_i) <= 5)
      Rails.logger.info("(ApiController::smell_report_create) ignoring smell report from user_hash=#{smell_report.user_hash} because time from last report is too soon")
      # sending reports too fast
      response = {
        :error => "failed to create smell report from submitted form."
      }
    elsif BannedUserHash.where(:user_hash => smell_report.user_hash).size > 0
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
          "address": params["address"],
          "geo": geo
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
  # PARAMS
  # start_time: Integer (default: time of first smell report)
  # end_time: Integer (default: now)
  # aggregate: {month|day|total}
  #   - If specified, aggregates the results by month/day/total
  # timezone_offset: Integer (default: 0)
  #   - JavaScript timezone offset, in minutes (see Date.getTimezoneOffset() for more info)
  # TODO this is misleading; this grabs from specific apps, NOT from specific areas (lat/long)
  # area: String (default: PGH)
  #   - The smell area code for smell reports
  # min_smell_value: Integer (default: 0)
  #   - The minimum smell value to include in the result
  # group_by_zipcode: {true|false}
  #   - If set to true, group your results by zipcode; this grouping is outside of the "aggregate" grouping
  # allegheny_county_only: {true|false} (default: false)
  #   - If set to true, only grab from zipcodes in Allegheny County.
  # zipcodes: String
  #   - A comma-separated list of zipcodes to select the smell reports from. Includes all zipcodes If not specified.
  # format:  {json|csv} (default: json)
  #   - What format the output should be in, either JSON or CSV.
  #
  def smell_report_index
    start_time = params["start_time"]
    end_time = params["end_time"]
    aggregate = params["aggregate"]
    timezone_offset = params["timezone_offset"]
    area = params["area"] == nil ? "PGH" : params["area"]
    min_smell_value = params["min_smell_value"] == nil ? 1 : params["min_smell_value"]
    max_smell_value = params["max_smell_value"] == nil ? 5 : params["max_smell_value"]
    group_by_zipcode = params["group_by_zipcode"] == "true" ? true : false
    zipcodes = params["zipcodes"]
    format_as = params["format"] == "csv" ? "csv" : "json"
    allegheny_county_only = params["allegheny_county_only"] == "true" ? true : false

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

    if zipcodes.blank?
      zipcodes = ZipCode.all.map(&:zip)
    else
      zipcodes = zipcodes.split ","
    end

    if allegheny_county_only
      zipcodes = zipcodes & AchdForm.allegheny_county_zipcodes
    end

    # grab all smell reports
    results = {}
    zipcodes.each { |z| results[z] = ZipCode.exists?(zip: z) ? ZipCode.find_by_zip(z).smell_reports.from_app(area).where(:created_at => start_datetime...end_datetime).where("smell_value>=" + min_smell_value.to_s).where("smell_value<=" + max_smell_value.to_s).order('created_at ASC') : [] }

    # bucket results
    results.each do |key,value|
      if aggregate == "month"
        results[key] = SmellReport.aggregate_by_month(value)
      elsif aggregate == "day"
        results[key] = SmellReport.aggregate_by_day(value, timezone_offset)
      elsif aggregate == "day_and_smell_value"
        results[key] = SmellReport.aggregate_by_day_and_smell_value(value, timezone_offset)
      elsif aggregate == "total"
        results[key] = value.size
      else
        results[key] = value.as_json(:only => [:latitude, :longitude, :smell_value, :smell_description, :feelings_symptoms, :created_at])
        unless format_as == "csv"
          # Convert created_at to epoch time
          for i in 0..results[key].size()-1
            results[key][i]["created_at"] = results[key][i]["created_at"].to_i
          end
        end
      end
    end

    # if we group by zipcode, then we're already done. Otherwise, flatten the results.
    unless group_by_zipcode
      if aggregate == "month"
        tmp = results
        results = {:month => [], :count => []}
        months = tmp.values.map{|u| u[:month]}.flatten(1).uniq.sort
        for i in 0..months.size-1 do
          results[:month].push(months[i])
          results[:count].push(0)
        end
        tmp.each do |k,value|
          for i in 0..value[:month].size-1 do
            index = results[:month].index(value[:month][i])
            results[:count][index] += value[:count][i] unless index.nil?
          end
        end
      elsif aggregate == "day"
        tmp = results
        results = {:day => [], :count => []}
        days = tmp.values.map{|u| u[:day]}.flatten(1).uniq.sort
        for i in 0..days.size-1 do
          results[:day].push(days[i])
          results[:count].push(0)
        end
        tmp.each do |k,value|
          for i in 0..value[:day].size-1 do
            index = results[:day].index(value[:day][i])
            results[:count][index] += value[:count][i] unless index.nil?
          end
        end
      elsif aggregate == "day_and_smell_value"
        tmp = results
        results = {:day_and_smell_value => [], :count => []}
        days = tmp.values.map{|u| u[:day_and_smell_value]}.flatten(1).uniq.sort
        for i in 0..days.size-1 do
          results[:day_and_smell_value].push(days[i])
          results[:count].push(0)
        end
        tmp.each do |k,value|
          for i in 0..value[:day_and_smell_value].size-1 do
            index = results[:day_and_smell_value].index(value[:day_and_smell_value][i])
            results[:count][index] += value[:count][i] unless index.nil?
          end
        end
      elsif aggregate == "total"
        results = {:total => results.values.sum}
      else
        results.keys.each{ |key| results[key].each{|row| row["zipcode"] = key} }
        # WARNING: this could get slow in the future
        results = results.values.flatten.sort_by{|u| u["created_at"]}
      end
    end

    # format output as CSV or JSON
    if format_as == "csv"
      csv_rows = []

      if group_by_zipcode
        if aggregate == "month"
          csv_rows.push ["date","zipcode","count"].to_csv
          results.each do |key,value|
            for i in 0..value[:month].size-1 do
              date = value[:month][i].join "-"
              csv_rows.push [date,key,value[:count][i]].to_csv
            end
          end
        elsif aggregate == "day"
          csv_rows.push ["date","zipcode","count"].to_csv
          results.each do |key,value|
            for i in 0..value[:day].size-1 do
              date = value[:day][i].strftime
              csv_rows.push [date,key,value[:count][i]].to_csv
            end
          end
        elsif aggregate == "total"
          csv_rows.push ["zipcode","count"].to_csv
          results.each do |key,value|
            csv_rows.push [key,value].to_csv
          end
        else
          csv_rows.push ["year","month","day","hour","minute","second","timezone","smell value","zipcode","smell decription"].to_csv
          results.each do |key,values|
            values.each do |value|
              date = value["created_at"]
              csv_rows.push [date.year,date.month,date.day,date.hour,date.min,date.sec,date.zone,value["smell_value"],key,value["smell_description"]].to_csv
            end
          end
        end
      else
        if aggregate == "month"
          csv_rows.push ["date","count"].to_csv
          for i in 0..results[:month].size-1 do
            date = results[:month][i].join "-"
            csv_rows.push [date,results[:count][i]].to_csv
          end
        elsif aggregate == "day"
          csv_rows.push ["date","count"].to_csv
          for i in 0..results[:day].size-1 do
            date = results[:day][i].strftime
            csv_rows.push [date,results[:count][i]].to_csv
          end
        elsif aggregate == "total"
          csv_rows.push ["count"].to_csv
          csv_rows.push [results[:total]].to_csv
        else
          csv_rows.push ["year","month","day","hour","minute","second","timezone","smell value","zipcode","smell decription"].to_csv
          results.each do |value|
            date = value["created_at"]
            csv_rows.push [date.year,date.month,date.day,date.hour,date.min,date.sec,date.zone,value["smell_value"],value["zipcode"],value["smell_description"]].to_csv
          end
        end
      end

      results = csv_rows.join ""

      headers["Content-Type"] = "text/csv; charset=utf-8"
      headers["Content-Disposition"] = "attachment; filename=\"smell_reports.csv\""
      render :plain => results
    else
      render :json => results
    end
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
