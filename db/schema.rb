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

ActiveRecord::Schema.define(version: 20160812202536) do

  create_table "achd_forms", force: :cascade do |t|
    t.string   "email",           limit: 255
    t.string   "phone",           limit: 255
    t.string   "name",            limit: 255
    t.integer  "smell_report_id", limit: 4
    t.datetime "created_at",                  null: false
    t.datetime "updated_at",                  null: false
  end

  add_index "achd_forms", ["smell_report_id"], name: "index_achd_forms_on_smell_report_id", using: :btree

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
    t.boolean  "submit_achd_form",                  default: false
  end

  add_foreign_key "achd_forms", "smell_reports"
end
