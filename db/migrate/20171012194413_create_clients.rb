class CreateClients < ActiveRecord::Migration
  def change
    create_table :clients do |t|
      t.string :name
      t.text :description
      t.text :secret_token

      t.timestamps null: false
    end
  end
end
