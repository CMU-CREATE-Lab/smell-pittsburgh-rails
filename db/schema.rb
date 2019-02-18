# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20190218225821) do

  create_table "agencies", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.string   "email",      limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
    t.string   "website",    limit: 255
    t.string   "full_name",  limit: 255
  end

  create_table "agencies_regions", id: false, force: :cascade do |t|
    t.integer "agency_id", limit: 4, null: false
    t.integer "region_id", limit: 4, null: false
  end

  create_table "agency_forms", force: :cascade do |t|
    t.string   "email",           limit: 255
    t.string   "phone",           limit: 255
    t.string   "name",            limit: 255
    t.integer  "smell_report_id", limit: 4
    t.datetime "created_at",                  null: false
    t.datetime "updated_at",                  null: false
    t.string   "address",         limit: 255
    t.integer  "agency_id",       limit: 4
  end

  add_index "agency_forms", ["agency_id"], name: "index_agency_forms_on_agency_id", using: :btree
  add_index "agency_forms", ["smell_report_id"], name: "index_agency_forms_on_smell_report_id", using: :btree

  create_table "banned_user_hashes", force: :cascade do |t|
    t.string   "user_hash",  limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  create_table "cities", force: :cascade do |t|
    t.float    "latitude",     limit: 24
    t.float    "longitude",    limit: 24
    t.integer  "zoom_level",   limit: 4
    t.string   "name",         limit: 255
    t.string   "state_code",   limit: 255
    t.text     "description",  limit: 65535
    t.text     "app_metadata", limit: 65535
    t.datetime "created_at",                 null: false
    t.datetime "updated_at",                 null: false
  end

  create_table "cities_regions", id: false, force: :cascade do |t|
    t.integer "region_id", limit: 4, null: false
    t.integer "city_id",   limit: 4, null: false
  end

  create_table "cities_zip_codes", id: false, force: :cascade do |t|
    t.integer "zip_code_id", limit: 4, null: false
    t.integer "city_id",     limit: 4, null: false
  end

  create_table "clients", force: :cascade do |t|
    t.string   "name",         limit: 255
    t.text     "description",  limit: 65535
    t.text     "secret_token", limit: 65535
    t.datetime "created_at",                 null: false
    t.datetime "updated_at",                 null: false
    t.string   "website",      limit: 255
  end

  create_table "map_markers", force: :cascade do |t|
    t.float    "latitude",    limit: 24
    t.float    "longitude",   limit: 24
    t.string   "marker_type", limit: 255
    t.text     "data",        limit: 65535
    t.integer  "city_id",     limit: 4
    t.datetime "created_at",                null: false
    t.datetime "updated_at",                null: false
  end

  create_table "regions", force: :cascade do |t|
    t.float    "latitude",    limit: 24
    t.float    "longitude",   limit: 24
    t.integer  "zoom_level",  limit: 4
    t.string   "name",        limit: 255
    t.datetime "created_at",                null: false
    t.datetime "updated_at",                null: false
    t.text     "description", limit: 65535
  end

  create_table "regions_zip_codes", id: false, force: :cascade do |t|
    t.integer "zip_code_id", limit: 4, null: false
    t.integer "region_id",   limit: 4, null: false
  end

  create_table "smell_reports", force: :cascade do |t|
    t.string   "user_hash",           limit: 255
    t.float    "latitude",            limit: 24
    t.float    "longitude",           limit: 24
    t.integer  "smell_value",         limit: 4
    t.text     "smell_description",   limit: 65535
    t.text     "feelings_symptoms",   limit: 65535
    t.datetime "created_at",                                        null: false
    t.datetime "updated_at",                                        null: false
    t.float    "horizontal_accuracy", limit: 24
    t.float    "vertical_accuracy",   limit: 24
    t.float    "real_latitude",       limit: 24
    t.float    "real_longitude",      limit: 24
    t.boolean  "send_form_to_agency",               default: false
    t.text     "additional_comments", limit: 65535
    t.integer  "zip_code_id",         limit: 4
    t.boolean  "custom_time",                       default: false
    t.boolean  "custom_location",                   default: false
    t.string   "street_name",         limit: 32
    t.integer  "client_id",           limit: 4
    t.integer  "observed_at",         limit: 4
    t.text     "debug_info",          limit: 65535
  end

  add_index "smell_reports", ["client_id"], name: "index_smell_reports_on_client_id", using: :btree
  add_index "smell_reports", ["zip_code_id"], name: "index_smell_reports_on_zip_code_id", using: :btree

  create_table "time_zones", force: :cascade do |t|
    t.string   "time_zone",  limit: 255
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  create_table "zip_codes", force: :cascade do |t|
    t.string   "zip",        limit: 10
    t.datetime "created_at",            null: false
    t.datetime "updated_at",            null: false
  end

  add_index "zip_codes", ["zip"], name: "index_zip_codes_on_zip", using: :btree

  add_foreign_key "agency_forms", "agencies"
  add_foreign_key "agency_forms", "smell_reports"
  add_foreign_key "smell_reports", "clients"
end
