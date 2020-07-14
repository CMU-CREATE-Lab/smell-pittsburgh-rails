class InitialPopulateStatesTable < ActiveRecord::Migration
  def change
    initial_states = ["PA", "KY"]

    initial_states.each_with_index do |state_code, i|
      state = State.find_or_create_by(:state_code => initial_states[i])
      state.save!
    end

    cities = City.all
    cities.each do |city|
      if city.id == 1
        city.state_id = 1
      elsif city.id == 2
        city.state_id = 2
      end
      city.save!
    end

    # Fix reports that don't have zip codes
    # Ignore reports from Bay Area app or ones not from the USA
    smell_reports_without_zips = SmellReport.where(zip_code_id: nil).where("user_hash NOT LIKE ?", "BA%")
    smell_reports_without_zips.each do |smell_report|
      puts "Looking up geocode for report #{smell_report.id} without a zip"
      begin
        geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{smell_report.real_latitude}, #{smell_report.real_longitude}" )
      rescue => e
        puts e
      end
      sleep(1)
      if geo and geo.zip and geo.country == "United States"
        state = State.find_or_create_by(state_code: geo.state) if geo.state
        zip_code = ZipCode.where(:zip => geo.zip).first_or_create do |zip|
          zip.state_id = state.id unless state.blank?
        end
        smell_report.zip_code_id = zip_code.id
        smell_report.save!
      end
    end

    # Add states to known city zips
    zips = ZipCode.all
    zips.each do |zip|
      city = zip.cities.first
      next unless city
      city_id = city.id
      if city_id == 1
        zip.state_id = 1
      elsif city_id == 2
        zip.state_id = 2
      end
      zip.save!
    end

    # Look up states for zips that don't have known cities
    # Ignore ones not from the USA
    smell_reports = SmellReport.all
    smell_reports.each do |smell_report|
      zip_code = smell_report.zip_code
      next if zip_code.blank?
      if zip_code.state.blank?
        puts "Looking up geocode for zip #{zip_code.id} from report #{smell_report.id} without a state"
        begin
          geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{smell_report.real_latitude}, #{smell_report.real_longitude}" )
        rescue => e
          puts e
        end
        sleep(1)
        if geo and geo.state and geo.country == "United States"
          state = State.find_or_create_by(state_code: geo.state)
          zip_code.state_id = state.id
          zip_code.save!
        end
      end
    end

  end
end
