class CreateBannedUserHashes < ActiveRecord::Migration
  def change
    create_table :banned_user_hashes do |t|
      t.string :user_hash

      t.timestamps null: false
    end
  end
end
