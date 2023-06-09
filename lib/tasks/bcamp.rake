require 'net/http'
require 'uri'
require 'json'

namespace :bcamp do

  DB_FILENAME = "db/bcamp_data.sqlite3"

  DBSEED_EVENT_CODES = [
    {
      :name => "Test",
      :code => 0,
      :description => "This event is used for testing purposes only and has no BCAMP data associated with it. Only admins will be notified by this event."
    },
    {
      :name => "Above Threshold",
      :code => 1,
      :description => "Indicates that a sample was reported at a value above the pollutant's threshold."
    },
    {
      :name => "Return Threshold",
      :code => 2,
      :description => "Indicates that a sample was reported at a value below the pollutant's threshold, proceeding a prior 'Above Threshold' event. There will be no notifications associated with this event."
    },
    {
      :name => "Sustained Threshold",
      :code => 3,
      :description => "Samples are still reporting values above the pollutant's threshold. This proceeds a prior 'Above Threshold' event with no 'Return Threshold' events logged for 6 hours since the initial 'Above Threshold' event."
    },
    {
      :name => "Unexpected Status",
      :code => 4,
      :description => "The data reported for a pollutant has an unexpected Status value. The expected value that is reported for Status is 1. Only admins will be notified by this event."
    },
  ]

  DBSEED_POLLUTANTS = [
    {
      :name => "Benzene Concentration",
      :pmtr => "ben",
      :measurement_units => "ppb",
      :threshold => 8.0
    },
    {
      :name => "Black Carbon Concentration",
      :pmtr => "bc_",
      :measurement_units => "ug/m3",
      :threshold => 25.0
    },
    {
      :name => "Ozone Concentration",
      :pmtr => "o3_",
      :measurement_units => "ug/m3",
      :threshold => 70.0
    },
    {
      :name => "PM2.5 Concentration",
      :pmtr => "pm25",
      :measurement_units => "ug/m3",
      :threshold => 35.0
    },
    {
      :name => "Sulfur Dioxide Concentration",
      :pmtr => "sox",
      :measurement_units => "ppb",
      :threshold => 75.0
    },
    {
      :name => "Toluene Concentration",
      :pmtr => "tol",
      :measurement_units => "ppb",
      :threshold => 10000.0
    },
    {
      :name => "Xylene Concentration",
      :pmtr => "xyl",
      :measurement_units => "ppb",
      :threshold => 5142.0
    },
  ]

  # NOTE: all timestamps in the BCAMP API indicate UTC but are actually in west coast time?
  BCAMP_API_STRFTIME = "%Y%m%dT%H:%M"
  BCAMP_API_DEFAULT_STARTDATE = "20230101T00:00"
  # NOTE: this __should__ handle the timezone discrepancies
  DATETIME_NOW = DateTime.now.in_time_zone("Pacific Time (US & Canada)").to_datetime.change(:offset => "0000")

  # values for sampledate returned by the API are in a string formatted such as "2023-01-31T08:25:00.000Z". This function will parse as a DateTime object
  def sampledate_str_to_datetime(sampledate)
    return DateTime.parse(sampledate)
  end


  ##
  # helpers for sqlite DB with active record (note: serialize implies YAML)
  ##
  class BcampPollutant < ActiveRecord::Base
    has_many :bcamp_data_points, :foreign_key => "pollutant_id"
    has_many :bcamp_events, :foreign_key => "pollutant_id"
  end
  class BcampDataPoint < ActiveRecord::Base
    belongs_to :bcamp_pollutant, :foreign_key => "pollutant_id"
  end
  class BcampEvent < ActiveRecord::Base
    serialize :parameters
    belongs_to :bcamp_pollutant, :foreign_key => "pollutant_id"
  end
  class BcampEventCode < ActiveRecord::Base
    # TODO do we actually want validations?
    #validates :code, :uniqueness => true
  end


  # Always call this before using any of the active record classes, or anything in sqlite (access to @connection)
  def establish_connection_to_sqlite_db
    connection = ActiveRecord::Base.establish_connection(
      :adapter  => "sqlite3",
      :database => DB_FILENAME
    )
    @connection = ActiveRecord::Base.connection
  end


  ##
  # Creates the database (with seeds)
  ##
  task :db_create => :environment do
    establish_connection_to_sqlite_db()

    @connection.create_table(:bcamp_pollutants) do |t|
      t.string :name
      t.string :pmtr # the code used by the API
      t.string :measurement_units
      t.float :threshold
    end
    @connection.create_table(:bcamp_data_points) do |t|
      t.float :value
      t.integer :pollutant_id
      t.integer :status
      t.timestamp :sampledate
    end
    @connection.create_table(:bcamp_events) do |t|
      t.integer :event_code
      t.timestamp :event_at
      t.integer :pollutant_id
      t.text :parameters # this will define key-value pairs relevant to specific event codes, if any
    end
    @connection.create_table(:bcamp_event_codes) do |t|
      t.integer :code
      t.string :name
      t.text :description
    end

    ## EVENTS: above threshold, below threshold, sustained threshold (6+ hrs), unexpected status, test
    ## consider catch-all event for admins only: where event code is unknown/unidentified/unimplemented?

    DBSEED_EVENT_CODES.each do |row|
      BcampEventCode.create!(row)
    end
    DBSEED_POLLUTANTS.each do |row|
      BcampPollutant.create!(row)
    end

    puts "sqlite3 database created as: #{DB_FILENAME}"
  end


  ##
  # Add an event with the 'Test' event code.
  ##
  task :test_event, [:msg] => :environment do |t, args|
    if args[:msg].blank?
      STDERR.puts "(print usage here)"
      exit
    end

    msg = args[:msg]
    STDERR.puts "your message was: #{msg}"

    # You can also specify key=value in your rake call, and rake can get environment vars:
    STDERR.puts ENV["key"] unless ENV["key"].blank?

    establish_connection_to_sqlite_db()
    BcampEvent.create(:event_code => 0, :event_at => DATETIME_NOW, :parameters => {:message => msg, :foo => 1})
  end


  ##
  # Grab pollutants (from sqlite), then perform curl for each. (to update events, you must invoke bcamp:update_events)
  ##
  task :update_data_from_api => :environment do
    establish_connection_to_sqlite_db()
    pollutants = BcampPollutant.all

    pollutants.each do |p|
      pmtr = p.pmtr
      Rake::Task["bcamp:update_data_from_api_for_pollutant"].invoke(pmtr)
      # .reenable allows a task to be invoked multiple times (otherwise it will only invoke once)
      Rake::Task["bcamp:update_data_from_api_for_pollutant"].reenable
    end
  end


  ##
  # Pulls the BCAMP API for a given pollutant.
  ##
  task :update_data_from_api_for_pollutant, [:pmtr] => :environment do |t, args|
    establish_connection_to_sqlite_db()

    pmtr = args[:pmtr]
    bcamp_pollutant = BcampPollutant.find_by_pmtr(pmtr)
    if bcamp_pollutant.nil?
      STDERR.puts "could not find pollutant with pmtr=#{pmtr} in DB"
      exit 2
    end
    puts "updating data from API for pollutant pmtr=#{pmtr}"

    enddate = DATETIME_NOW.strftime(BCAMP_API_STRFTIME)
    most_recent_data = BcampDataPoint.where(:pollutant_id => bcamp_pollutant.id).sort_by(&:sampledate).last
    startdate = most_recent_data.nil? ? BCAMP_API_DEFAULT_STARTDATE : most_recent_data.sampledate.strftime(BCAMP_API_STRFTIME)

    uri = URI.parse("https://dbquery.argos-sci.info/?host=fenceline.org&database=argos&pmtr=#{pmtr}&table=benecia_05&startdate=#{startdate}&enddate=#{enddate}")
    request = Net::HTTP::Get.new(uri)
    request.basic_auth(BCAMP_USER, BCAMP_PASSWD)

    req_options = {
      use_ssl: uri.scheme == "https",
    }

    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(request)
    end

    begin
      json = JSON.parse(response.body)
    rescue
      STDERR.puts "Failed to parse JSON from response."
      exit 1
    end

    json.each do |row|
      # check against DB if rows already exist (assert that sampledate is unique per pollutant)
      if BcampDataPoint.where(:pollutant_id => bcamp_pollutant.id, :sampledate => sampledate_str_to_datetime(row["sampledate"])).size > 0
        puts "pmtr=#{pmtr}:  ...(skipped @#{row["sampledate"]})"
      else
        BcampDataPoint.create!(:pollutant_id => bcamp_pollutant.id, :sampledate => sampledate_str_to_datetime(row["sampledate"]), :status => row["status"], :value => row["value"])
        puts "pmtr=#{pmtr}: added sampledate #{row["sampledate"]}"
      end
    end
  end


  ##
  # Grab current bcamp data points (from sqlite), then update events as needed.
  ##
  task :update_events => :environment do
    EVENT_CODE_ABOVE = DBSEED_EVENT_CODES[1][:code]
    EVENT_CODE_RETURN = DBSEED_EVENT_CODES[2][:code]
    EVENT_CODE_SUSTAIN = DBSEED_EVENT_CODES[3][:code]
    events_to_update = []
    establish_connection_to_sqlite_db()

    BcampPollutant.all.each do |p|
      last_above = p.bcamp_events.where(:event_code => EVENT_CODE_ABOVE).order(:event_at).last
      last_return = last_above.nil? ? nil : p.bcamp_events.where(:event_code => EVENT_CODE_RETURN, :event_at => last_above.event_at..DATETIME_NOW).order(:event_at).last
      last_sustain = last_above.nil? ? nil : p.bcamp_events.where(:event_code => EVENT_CODE_SUSTAIN, :event_at => last_above.event_at..DATETIME_NOW).order(:event_at).last
      most_recent_data = p.bcamp_data_points.order(:sampledate).last

      unless most_recent_data.nil?
        ## Status 1 means that the reading is correct and all the internal instrument checks have passed.
        ## Other statuses indicate a fault of some sort (5 = maintenance mode, 4 = instrument fault, 8 = low signal or offline)
        next if (most_recent_data.status != 1)

        if most_recent_data.value < p.threshold
          # we only want to register the "Return Threshold" event whenever the most recent data is below threshold
          # AND there does not already exist a return threshold event, following a prior above threshold event
          if not last_above.nil? and last_return.nil?
            # (Return Threshold)
            event = BcampEvent.new(:pollutant_id => p.id, :event_code => EVENT_CODE_RETURN, :event_at => most_recent_data.sampledate)
            event.save
            events_to_update.push(event)
          end
        else
          if last_above.nil?
            # this will create the first "Above Threshold" event
            event = BcampEvent.new(:pollutant_id => p.id, :event_code => EVENT_CODE_ABOVE, :event_at => most_recent_data.sampledate)
            event.save
            events_to_update.push(event)
          else
            # otherwise, we have to check if the past Above Threshold event has an associated Return Threshold event
            if not last_return.nil?
              # If so, we create a new "Above Threshold" event
              event = BcampEvent.new(:pollutant_id => p.id, :event_code => EVENT_CODE_ABOVE, :event_at => most_recent_data.sampledate)
              event.save
              events_to_update.push(event)
            else
              # Finally, if Return Threshold event never happened, we check for Sustained Threshold
              if last_sustain.nil?
                from = last_above.event_at.to_datetime.to_i
                to = most_recent_data.sampledate.to_datetime.to_i
                if ( (to-from) / 3600 ) >= 6
                  # (Sustained Threshold)
                  event = BcampEvent.new(:pollutant_id => p.id, :event_code => EVENT_CODE_SUSTAIN, :event_at => most_recent_data.sampledate)
                  event.save
                  events_to_update.push(event)
                end
              end
            end
          end
        end
      end
    end

    # handle events_to_update
    event_ids = events_to_update.map(&:id).join(":")
    Rake::Task["bcamp:notify_for_events"].invoke(event_ids) unless event_ids.blank?
  end


  ##
  # Notify for the list of event ids, denoted as a string with colons(:) separating each ID (can't use a comma)
  ##
  task :notify_for_events, [:event_ids] => :environment do |t, args|
    EVENT_CODE_TEST = DBSEED_EVENT_CODES[0][:code]
    EVENT_CODE_ABOVE = DBSEED_EVENT_CODES[1][:code]
    EVENT_CODE_RETURN = DBSEED_EVENT_CODES[2][:code]
    EVENT_CODE_SUSTAIN = DBSEED_EVENT_CODES[3][:code]
    EVENT_CODE_UNKNOWN = DBSEED_EVENT_CODES[4][:code]
    establish_connection_to_sqlite_db()

    if args[:event_ids].blank?
      STDERR.puts "(print usage here)"
      exit
    end

    event_ids = args[:event_ids].split(":")
    events = BcampEvent.where(:id => event_ids)
    list_notify_bcamp = []
    list_notify_admin = []
    events.each do |e|
      datetime = e.event_at.strftime("%I:%M %p")
      case e.event_code
        when EVENT_CODE_TEST
          event_str = "(admin) A test event occurred at #{datetime}."
        when EVENT_CODE_ABOVE
          pollutant = e.bcamp_pollutant
          datapoint = BcampDataPoint.where(:pollutant_id => pollutant.id, :sampledate => e.event_at).first
          event_str = "At #{datetime}, the measurement for '#{pollutant.name}' was #{datapoint.value}, which is above the threshold of #{pollutant.threshold} #{pollutant.measurement_units}."
          list_notify_admin.push event_str
          list_notify_bcamp.push event_str
        when EVENT_CODE_RETURN
          pollutant = e.bcamp_pollutant
          datapoint = BcampDataPoint.where(:pollutant_id => pollutant.id, :sampledate => e.event_at).first
          event_str = "(admin reported for verbosity) At #{datetime}, the '#{pollutant.name}' pollutant dropped to #{datapoint.value}, which is below the threshold of #{pollutant.threshold} #{pollutant.measurement_units}."
          list_notify_admin.push event_str
        when EVENT_CODE_SUSTAIN
          pollutant = e.bcamp_pollutant
          datapoint = BcampDataPoint.where(:pollutant_id => pollutant.id, :sampledate => e.event_at).first
          event_str = "As of #{datetime}, The measurement for '#{pollutant.name}' has remained above the threshold of #{pollutant.threshold} #{pollutant.measurement_units} for at least 6 hours."
          list_notify_admin.push event_str
          list_notify_bcamp.push event_str
        when EVENT_CODE_UNKNOWN
          event_str = "(admin) An unknown event occurred at #{datetime}."
          list_notify_admin.push event_str
        else
          event_str = "(admin) An unknown event occurred at #{datetime}."
          list_notify_admin.push event_str
      end
    end

    # Remove the (sqlite3) connection, then re-establish the default (mysql2) connection.
    ActiveRecord::Base.remove_connection
    ActiveRecord::Base.establish_connection

    unless list_notify_bcamp.empty?
      EmailSubscription.where(:subscribe_bcamp => true).each do |subscription|
        SubscriptionMailer.notify_bcamp(subscription, list_notify_bcamp).deliver_now
      end
    end
    unless list_notify_admin.empty?
      EmailSubscription.where(:subscribe_admin => true).each do |subscription|
        SubscriptionMailer.notify_admin(subscription, list_notify_admin).deliver_now
      end
    end
  end

end
