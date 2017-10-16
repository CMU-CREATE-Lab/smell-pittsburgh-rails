class CreateClients < ActiveRecord::Migration
  def change
    create_table :clients do |t|
      t.string :name
      t.string :hash_prefix

      t.timestamps null: false
    end
  end
end
