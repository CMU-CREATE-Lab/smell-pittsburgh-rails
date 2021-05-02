require 'digest'
module ApplicationHelper
	def self.get_time_by_city(city)
		server_city = "Pittsburgh"
		cur_time = Time.now.hour
		standard_time = cur_time - City.find_by_name(server_city).gmt_offset
		c = City.find_by_name(city)
		if c.nil?
			return cur_time
		else

			city_offset = c.gmt_offset
			return standard_time + city_offset
		end
	end
	
	def self.get_time_by_alias(city_alias)
		server_alias = "PGH"
		cur_time = Time.now.hour
		standard_time = cur_time - City.find_by_alias(server_alias).gmt_offset
		a = City.find_by_alias(city_alias)
		if a.nil?
			return cur_time
		else
			alias_offset =a.gmt_offset
			return standard_time + alias_offset
		end

	def self.hash_city(city,state_code)
		return Digest::SHA256.hexdigest(city+state_code)
	end
end
