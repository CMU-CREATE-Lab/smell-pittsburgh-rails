# Load DSL and set up stages
require "capistrano/setup"

# Include default deployment tasks
require "capistrano/deploy"

require 'capistrano/rails/assets'
require 'capistrano/sudo'
# replaces old rvm-capistrano gem: https://github.com/rvm/rvm1-capistrano3
require 'rvm1/capistrano3'

# Load custom tasks from `lib/capistrano/tasks` if you have any defined
Dir.glob("lib/capistrano/tasks/*.rake").each { |r| import r }
