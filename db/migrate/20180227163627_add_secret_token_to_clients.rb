class AddSecretTokenToClients < ActiveRecord::Migration
  def change
    add_column :clients, :secret_token, :text
  end
end
