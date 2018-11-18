require 'csv'

class ApiController < ApplicationController

  # protect_from_forgery with: :null_session
  skip_before_action :verify_authenticity_token, :only => [:smell_report_create, :smell_report_create_api2]


  # POST /api/v1/smell_reports
  #
  # PARAMS
  # "latitude" : Double *
  # "longitude" : Double *
  # "user_hash" : String *
  # "smell_value" : Integer *
  # "smell_description" : String
  # "feelings_symptoms" : String
  # "additional_comments" : String
  #   (specific to ACHD form submission)
  # "custom_location" : Boolean
  #   - Specify that the location for the report was manually entered and is not from GPS
  # "custom_time" : Boolean
  #   - Specify that the time for the report was manually entered (observed_at) and is not the current time
  # "observed_at" : DateTime (RFC3339)
  # "send_form_to_agency" : Boolean
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
    smell_report.additional_comments = params["additional_comments"] unless params["additional_comments"].blank?

    # mark custom fields when included
    smell_report.custom_location = (not params["custom_location"].blank? and params["custom_location"] == "true") ? true : false
    smell_report.custom_time = (not params["custom_time"].blank? and params["custom_time"] == "true") ? true : false

    # determine smell report observed at time
    # string format: %Y-%m-%dT%H:%M:%S%:z
    smell_report.observed_at = DateTime.rfc3339(params["observed_at"]).to_i unless params["observed_at"].blank?
    if smell_report.custom_time == false or smell_report.observed_at.blank?
      smell_report.observed_at = Time.now.to_i
      smell_report.custom_time = false
    end

    # by default, send to achd
    smell_report.send_form_to_agency = true
    # override default when flag is present in API request
    # TODO rename this param to match new column name (submit_achd_form => send_form_to_agency)
    smell_report.send_form_to_agency = (params["submit_achd_form"].blank? ? false : true) unless params["submit_achd_form"].nil?
    # do not send to ACHD if the smell report is outside the pgh bounding box
    # TODO we should also check against a list of valid zipcodes for ACHD submission
    smell_report.send_form_to_agency = false unless SmellReport.is_within_pittsburgh?(smell_report.latitude,smell_report.longitude)
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
        :additional_comments => smell_report.additional_comments
      }

      # # send push notifications for smell values at or above 3
      # if SmellReportTracker.is_listening_for_smell_reports? and smell_report.smell_value >= 3 and smell_report.is_within_pittsburgh?
      #   SmellReportTracker.set_last_reported(smell_report.created_at.to_i)
      #   SmellReportTracker.listening_for_smell_reports(false)
      #   SmellReportTracker.generating_hourly_summary(true)
      #   FirebasePushNotification.push_smell_report(smell_report)
      # end

      # send push notifications for smell values at or above 3 in Bay Area
      if BASmellReportTracker.is_listening_for_smell_reports? and smell_report.smell_value >= 3 and smell_report.is_within_bay_area?
        BASmellReportTracker.set_last_reported(smell_report.created_at.to_i)
        BASmellReportTracker.listening_for_smell_reports(false)
        BASmellReportTracker.generating_hourly_summary(true)
        FirebasePushNotification.push_smell_report(smell_report,"BA")
      end

      # send email
      if smell_report.send_form_to_agency
        options = {
          "reply_email": params["email"],
          "name": params["name"],
          "phone_number": params["phone_number"],
          "address": params["address"],
          "geo": geo
        }
        AgencyForm.submit_form(smell_report,options)
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
    timezone_offset = params["timezone_offset"].blank? ? 0 : params["timezone_offset"].to_i
    area = params["area"] == nil ? "PGH" : params["area"]
    min_smell_value = params["min_smell_value"] == nil ? 1 : params["min_smell_value"]
    max_smell_value = params["max_smell_value"] == nil ? 5 : params["max_smell_value"]
    group_by_zipcode = params["group_by_zipcode"] == "true" ? true : false
    zipcodes = params["zipcodes"]
    format_as = params["format"] == "csv" ? "csv" : "json"
    allegheny_county_only = params["allegheny_county_only"] == "true" ? true : false
    prediction_query = params["prediction_query"] == "true" ? true : false

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
      zipcodes = zipcodes & AgencyForm.allegheny_county_zipcodes
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
        fields = [:latitude, :longitude, :smell_value, :smell_description, :feelings_symptoms, :created_at]
        # TODO: Specific to Bay Area
        fields << :additional_comments if area == "BA"
        # prediction query
        methods = prediction_query ? [:anonymized_user_hash] : []
        results[key] = value.as_json(:only => fields, :methods => methods)
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
          csv_rows.push ["year","month","day","hour","minute","second","timezone","smell value","zipcode","smell description"].to_csv
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
          csv_rows.push ["year","month","day","hour","minute","second","timezone","smell value","zipcode","smell description"].to_csv
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
  # PARAMS:
  # "city" or "zipcode" : String
  def get_aqi
    @aqi = "null"
	  if (params["zipcode"])
      zipcode = params["zipcode"]
      if(!(Rails.cache.exist?("current_aqi_#{zipcode}") and (((Rails.cache.read("current_aqi_#{zipcode}")[1]).to_i-Time.now.to_i).abs < 60*60)))
	      AirnowAqi.update_city_aqi({"name"=>"onlyZip","zipcode"=>params["zipcode"]})
      end
	    val = AqiTracker.get_current_aqi_zip(params["zipcode"])
  	else
		  AqiTracker.cities.each do |hash|
		    if (hash.has_value?(params["city"]))
			    val = AqiTracker.get_current_aqi(hash)
			    break
		    end
	    end
    end
    @aqi = val
    render :json => @aqi.to_json
  end

  def regions_index
    render :json => Region.all.to_json(:except => [:description])
  end


  def cities_index
    render :json => City.all.to_json(:except => [:description])
  end


  def regions_show
    if Region.exists? params[:id]
      @region = Region.find params[:id]
      render :json => @region.to_json(:except => [:description])
    else
      render :json => { :error => "Region does not exist." }, :status => 404
    end
  end


  def cities_show
    if City.exists? params[:id]
      @city = Region.find params[:id]
      render :json => @city.to_json(:except => [:description])
    else
      render :json => { :error => "City does not exist." }, :status => 404
    end
  end


  def clients_index
    render :json => Client.all.to_json(:only => [:id, :name, :created_at])
  end

  def cities_map_markers
    city_ids = params[:id].split(",")
    response = []
    city_ids.each do |city_id|
      @city = City.find_by_id(city_id)
      response << {"name" => @city.name, "state_code" => @city.state_code, "markers" => @city.map_markers.map(&:to_api)} if @city
    end
    if response.empty?
      render :json => { :error => "City does not exist." }, :status => 404
    else
      render :json => response
    end
  end


  def get_city_by_zip
    zipCode = params[:zipCode]
    @city = City.includes(:zip_codes).where('zip_codes.zip' => zipCode)
    if @city.empty?
      render :json => { :error => "No participating city has that zip code." }, :status => 404
    else
      render :json => @city.first
    end
  end


  def regions_zip_codes
    if Region.exists? params[:id]
      @region = Region.find params[:id]
      render :json => @region.zip_codes.map(&:zip).to_json
    else
      render :json => { :error => "Region does not exist." }, :status => 404
    end
  end


  def cities_zip_codes
    if City.exists? params[:id]
      @city = City.find params[:id]
      render :json => @city.zip_codes.map(&:zip).to_json
    else
      render :json => { :error => "City does not exist." }, :status => 404
    end
  end


  def zip_codes
    render :json => ZipCode.all.to_json(:only => [:id, :zip])
  end


  # POST /api/v2/smell_reports
  #
  # PARAMS (required fields denoted by asterisk)
  # "client_token" : String *
  # "latitude" : Double *
  # "longitude" : Double *
  # "user_hash" : String *
  # "smell_value" : Integer *
  # "smell_description" : String
  # "feelings_symptoms" : String
  # "additional_comments" : String
  #   (specific to ACHD form submission)
  # "debug_info" : String
  # "custom_location" : Boolean
  #   - Specify that the location for the report was manually entered and is not from GPS
  # "custom_time" : Boolean
  #   - Specify that the time for the report was manually entered (observed_at) and is not the current time
  # "observed_at" : DateTime (RFC3339)
  # "send_form_to_agency" : Boolean
  #   - When set to true, send smell report info to relevant agencies (currently ACHD only)
  # "email" : String [FILTERED]
  # "name" : String [FILTERED]
  # "phone_number" : String [FILTERED]
  # "address" : String [FILTERED]
  #
  def smell_report_create_api2
    # check client
    client_token = params["client_token"].blank? ? "" : params["client_token"]
    client = Client.find_by_secret_token(client_token)
    unless client
      response = {
        :error => "client_token not recognized."
      }
      render :json => response, :layout => false, :status => :internal_server_error
      return
    end

    # create SmellReport object
    smell_report = SmellReport.new
    smell_report.client = client
    smell_report.latitude = params["latitude"].to_f unless params["latitude"].blank?
    smell_report.longitude = params["longitude"].to_f unless params["longitude"].blank?
    smell_report.user_hash = params["user_hash"] unless params["user_hash"].blank?
    smell_report.smell_value = params["smell_value"].to_i unless params["smell_value"].blank?
    smell_report.smell_description = params["smell_description"] unless params["smell_description"].blank?
    smell_report.feelings_symptoms = params["feelings_symptoms"] unless params["feelings_symptoms"].blank?
    smell_report.additional_comments = params["additional_comments"] unless params["additional_comments"].blank?
    smell_report.debug_info = params["debug_info"] unless params["debug_info"].blank?

    # drop/avoid spam reports
    last_smell_report_from_user = SmellReport.where(:user_hash => smell_report.user_hash).order("created_at").last
    if (last_smell_report_from_user and (Time.now.to_i - last_smell_report_from_user.created_at.to_i) <= 5)
      Rails.logger.info("(ApiController::smell_report_create) ignoring smell report from user_hash=#{smell_report.user_hash} because time from last report is too soon")
      # sending reports too fast (within 5 seconds of previous)
      response = {
        :error => "failed to create smell report from submitted form."
      }
      render :json => response, :layout => false
      return
    elsif BannedUserHash.where(:user_hash => smell_report.user_hash).size > 0
      Rails.logger.info("(ApiController::smell_report_create) ignoring smell report with banned user_hash=#{smell_report.user_hash}")
      # banned users
      response = {
        :error => "failed to create smell report from submitted form."
      }
      render :json => response, :layout => false
      return
    end

    # mark custom fields when included
    smell_report.custom_location = (not params["custom_location"].blank? and params["custom_location"] == "true") ? true : false
    smell_report.custom_time = (not params["custom_time"].blank? and params["custom_time"] == "true") ? true : false

    # determine smell report observed at time
    # string format: %Y-%m-%dT%H:%M:%S%:z
    smell_report.observed_at = DateTime.rfc3339(params["observed_at"]).to_i unless params["observed_at"].blank?
    if smell_report.custom_time == false or smell_report.observed_at.blank?
      smell_report.observed_at = Time.now.to_i
      smell_report.custom_time = false
    end

    # by default, send to agency
    smell_report.send_form_to_agency = true
    # override when flag is present in API request (and blank non-nil implies false)
    smell_report.send_form_to_agency = (params["send_form_to_agency"].blank? ? false : true) unless params["send_form_to_agency"].nil?

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

    if smell_report.save
      # success
      response = {
        :latitude => smell_report.latitude,
        :longitude => smell_report.longitude,
        :user_hash => smell_report.user_hash,
        :smell_value => smell_report.smell_value,
        :smell_description => smell_report.smell_description,
        :feelings_symptoms => smell_report.feelings_symptoms,
        :additional_comments => smell_report.additional_comments
      }

      # NOTE: we have removed the smell report trackers, which pushed notifications for smell values at or above 3

      # send email
      if smell_report.send_form_to_agency
        options = {
          "reply_email": params["email"],
          "name": params["name"],
          "phone_number": params["phone_number"],
          "address": params["address"],
          "geo": geo
        }
        regions = smell_report.zip_code.regions
        unless regions.empty?
          # create and submit one form per agency (smell_report => zip_code => regions => agencies)
          regions.map(&:agencies).flatten.uniq.each do |agency|
            options.agency_name = agency.name
            options.agency_email = agency.email
            agency.create_and_submit_form(smell_report,options)
          end
        end
      end
    else
      # fail
      response = {
        :error => "failed to create smell report from submitted form."
      }
      render :json => response, :layout => false, :status => :internal_server_error
      return
    end

    render :json => response, :layout => false
  end


  # GET /api/v2/smell_reports
  #
  # PARAMS
  # start_time: Integer (default: 0)
  # end_time: Integer (default: now)
  # client_ids: List of Client IDs
  # region_ids: List of Region IDs
  # city_ids: List of City IDs
  # smell_value: List of smell values (default: "1,2,3,4,5")
  # latlng_bbox: lat/long coordinates, top-left to bottom-right
  # group_by: {zipcode|month|day}
  # aggregate: {true|false} (default: False)
  # timezone_offset: number representing offset in minutes (default: 0)
  # zipcodes: List of zipcodes
  # format:  {json|csv} (default: json)
  #   - What format the output should be in, either JSON or CSV.
  #
  def smell_reports_index_api2
    start_time = params["start_time"]
    end_time = params["end_time"]

    client_ids = params["client_ids"].nil? ? [] : params["client_ids"].split(",").map(&:to_i)
    region_ids = params["region_ids"].nil? ? [] : params["region_ids"].split(",").map(&:to_i)
    city_ids = params["city_ids"].nil? ? [] : params["city_ids"].split(",").map(&:to_i)
    smell_values = params["smell_value"].blank? ? [] : params["smell_value"].split(",").map(&:to_i)
    latlng_bbox = params["latlng_bbox"].blank? ? [] : params["latlng_bbox"].split(",").map(&:to_f)
    group_by = ["zipcode","month","day"].index(params["group_by"]).nil? ? "" : params["group_by"]
    aggregate = (params["aggregate"] == "true")
    timezone_offset = params["timezone_offset"].blank? ? 0 : params["timezone_offset"].to_i
    zipcodes = params["zipcodes"].blank? ? [] : params["zipcodes"].split(",")
    format_as = ["csv","json"].index(params["format"]).nil? ? "json" : params["format"]

    time_range = [0, Time.now.to_i]
    time_range[0] = start_time.to_i if start_time
    time_range[1] = end_time.to_i if end_time

    #
    # 1. zip_codes/regions/cities; regions take precedence
    zip_codes = zipcodes.map{|i| ZipCode.where(:zip => i).first}.delete_if(&:nil?).uniq
    if not region_ids.empty?
      zip_codes = (zip_codes + region_ids.map{ |i| Region.find(i) if Region.exists?(i) }.delete_if(&:nil?).map(&:zip_codes).flatten).uniq
    elsif not city_ids.empty?
      zip_codes = (zip_codes + city_ids.map{ |i| City.find(i) if City.exists?(i) }.delete_if(&:nil?).map(&:zip_codes).flatten).uniq
    end
    results = zip_codes.empty? ? [SmellReport.all] : zip_codes.map(&:smell_reports)
    #
    # 2. clients
    unless client_ids.empty?
      results.map!{|i| i.where(:client_id => client_ids)}
    end
    #
    # 3. smell_values
    unless smell_values.empty?
      results.map!{|i| i.where(:smell_value => smell_values)}
    end
    #
    # 4. time_range
    if start_time or end_time
      results.map!{|i| i.where(:observed_at => time_range[0]..time_range[1])}
    end
    #
    # 5. latlng_bbox (top-left to bottom-right)
    if latlng_bbox.size == 4
      # this checks whether the bounding box wraps around in latitude/longitude values (checks that lat1>lat2 and lng1<lng2)
      lat_ranges = (latlng_bbox[0] > latlng_bbox[2]) ? [latlng_bbox[2]..latlng_bbox[0]] : [-90..latlng_bbox[0], latlng_bbox[2]..90]
      long_ranges = (latlng_bbox[1] < latlng_bbox[3]) ? [latlng_bbox[1]..latlng_bbox[3]] : [latlng_bbox[1]..180, -180..latlng_bbox[3]]
      # we are bounding on the perturbed lat/long
      results.map!{|i| i.where(:latitude => lat_ranges).where(:longitude => long_ranges)}
    end
    #
    # 6. group_by and aggregate
    id_zip_hash = Hash[ZipCode.all.map{|z| [z.id,z.zip]}]
    if group_by.blank? or format_as == "csv"
      results = results.flatten
      # format as json
      results = results.as_json(:only => [:latitude, :longitude, :smell_value, :feelings_symptoms, :smell_description, :observed_at, :zip_code_id])
      # plus zipcode
      results.each do |json|
        json["zipcode"] = id_zip_hash[json["zip_code_id"]]
      end
    else
      if group_by == "month"
        # results = SmellReport.aggregate_by_month(results)
        # NOTE: this is a bit hacky. we are just adding seconds to the time object, which defaults to UTC. This will bucket the times properly (for month/day) based on timezone offset.
        results = results.flatten.group_by{|i| Time.at(i.observed_at-timezone_offset*60).strftime("%Y-%m")}
      elsif group_by == "day"
        # results = SmellReport.aggregate_by_day(results,timezone_offset)
        # NOTE: (see above reference)
        results = results.flatten.group_by{|i| Time.at(i.observed_at-timezone_offset*60).strftime("%Y-%m-%d")}
      elsif group_by == "zipcode"
        tmp = results.flatten
        results = {}
        tmp_zips = tmp.map(&:zip_code_id).uniq.delete_if(&:nil?).map{|i| ZipCode.find(i)}.delete_if(&:nil?)
        tmp_zips.each do |zip|
          results[zip.zip] = zip.smell_reports & tmp
        end
      end
      if aggregate
        results.each do |key,value|
          results[key] = value.size
        end
      else
        # format grouped values as json
        results.each do |key,value|
          results[key] = value.as_json(:only => [:latitude, :longitude, :smell_value, :feelings_symptoms, :smell_description, :observed_at, :zip_code_id])
        end
        # plus zipcode
        results.values.flatten.each do |json|
          json["zipcode"] = id_zip_hash[json["zip_code_id"]]
        end
      end
    end

    if format_as == "csv"
      csv_rows = []

      csv_rows.push ["epoch time","rfc3339 time","smell value","zipcode","smell description","feelings symptoms"].to_csv
      results.each do |value|
        csv_rows.push [value["observed_at"],Time.at(value["observed_at"]).to_datetime.rfc3339,value["smell_value"],value["zipcode"],value["smell_description"],value["feelings_symptoms"]].to_csv
      end

      headers["Content-Type"] = "text/csv; charset=utf-8"
      headers["Content-Disposition"] = "attachment; filename=\"smell_reports.csv\""
      render :plain => csv_rows.join("")
    else
      render :json => results.to_json
    end
  end

end
