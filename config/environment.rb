# Load the Rails application.
require File.expand_path('../application', __FILE__)

# Initialize the Rails application.
Rails.application.initialize!

CLIENT_ID_SMELLPGH = 1
CLIENT_ID_BA = 2
CLIENT_ID_SMELLMYCITY = 3

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
# this is a string appended to user hash when reporting anonymized user hashes
ANONYMOUS_USER_HASH = "DO-NOT-PUSH-ME"
# Google Maps API Key
GOOGLE_MAPS_API_KEY = "DO-NOT-PUSH-ME"
