source 'https://rubygems.org'


# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '4.2.11.1'
# Until we go to >= Ruby 2.2.6 we need to max out at this version
gem 'net-ssh', '4.2.0'
# Use mysql2 as the database for Active Record
# Going past this version requires Rails >= 5.x
gem 'mysql2', '0.4.10'
# Use SCSS for stylesheets
gem 'sass-rails', '~> 5.0'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'
# Use CoffeeScript for .coffee assets and views
gem 'coffee-rails', '~> 4.1.0'
# See https://github.com/rails/execjs#readme for more supported runtimes
gem 'therubyracer', platforms: :ruby
# Until we go to >= Ruby 2.3 we need to max out at this version
gem 'nokogiri', '1.10.8'

# Use jquery as the JavaScript library
gem 'jquery-rails'
# Turbolinks makes following links in your web application faster. Read more: https://github.com/rails/turbolinks
gem 'turbolinks'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.0'
# bundle exec rake doc:rails generates the API under doc/api.
gem 'sdoc', '~> 0.4.0', group: :doc

# Use ActiveModel has_secure_password
# gem 'bcrypt', '~> 3.1.7'

# Use Unicorn as the app server
# gem 'unicorn'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  # Until we go to >= Ruby 2.3 we need to max out at this version
  gem 'byebug', '10.0.2'
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> in views
  gem 'web-console', '~> 2.0'

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  # Until we go to >= Ruby 2.4 we need to max out at this version
  gem 'spring', '2.0.2'

  # Windows specific gems
  gem 'tzinfo-data'
end

# Geokit Rails
gem 'geokit-rails'

# Capistrano
gem 'capistrano', '3.5.0', require: false
gem 'capistrano-sudo', require: false
# replaces old rvm-capistrano gem: https://github.com/rvm/rvm1-capistrano3
gem 'rvm1-capistrano3', require: false
# terminal input-hiding for capistrano
gem 'highline', require: false
