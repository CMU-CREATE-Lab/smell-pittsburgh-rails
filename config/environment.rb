# Load the Rails application.
require File.expand_path('../application', __FILE__)

# NOTE: these constants appear before application init (since NOTIFICATION_URL_HASH is used in routes.db)
# random hash for the URL to control notifications
NOTIFICATION_URL_HASH = "DO-NOT-PUSH-ME"

# Initialize the Rails application.
Rails.application.initialize!

CLIENT_ID_SMELLPGH = 1
CLIENT_ID_BA = 2
CLIENT_ID_SMELLMYCITY = 3
CLIENT_ID_SMELLPGHWEBSITE = 4
CLIENT_ID_SMELLMYCITYWEBSITE = 5

#
# IMPORTANT!
#
#  For production environments, these must be defined in config/environments/production.rb
#
# Authorization Key for Google Firebase Push Notifications
FIREBASE_AUTH_KEY = "DO-NOT-PUSH-ME"
# for smell mycity
SMC_FIREBASE_AUTH_KEY = "DO-NOT-PUSH-ME"
# Auth Key for AirNow API
AIRNOW_API_KEY = "DO-NOT-PUSH-ME"
# the email address for who receives the ACHD Form mail
ACHD_EMAIL_RECIPIENT = "DO-NOT-PUSH-ME"
# this is a string appended to user hash when reporting anonymized user hashes
ANONYMOUS_USER_HASH = "DO-NOT-PUSH-ME"
# Google Maps API Key
GOOGLE_MAPS_API_KEY = "DO-NOT-PUSH-ME"

# Related to BCAMP API
BCAMP_USER = "DO-NOT-PUSH-ME"
BCAMP_PASSWD = "DO-NOT-PUSH-ME"
