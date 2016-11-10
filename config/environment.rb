# Load the Rails application.
require File.expand_path('../application', __FILE__)

# Initialize the Rails application.
Rails.application.initialize!

#
# IMPORTANT!
#
#  For production environments, these must be defined in config/environments/production.rb
#
# Authorization Key for Google Firebase Push Notifications
FIREBASE_AUTH_KEY = "DO-NOT-PUSH-ME"
# Auth Key for AirNow API
AIRNOW_API_KEY = "DO-NOT-PUSH-ME"
# the email address for who receives the ACHD Form mail
ACHD_EMAIL_RECIPIENT = "DO-NOT-PUSH-ME"
