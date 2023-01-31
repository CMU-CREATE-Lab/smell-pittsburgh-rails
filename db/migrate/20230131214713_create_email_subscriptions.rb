class CreateEmailSubscriptions < ActiveRecord::Migration
  def change
    create_table :email_subscriptions do |t|
      t.string :email
      t.boolean :subscribe_admin, :default => false
      t.boolean :subscribe_bcamp, :default => false

      t.timestamps null: false
    end
  end
end
