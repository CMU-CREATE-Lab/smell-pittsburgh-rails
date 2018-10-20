class AddWebsiteToClients < ActiveRecord::Migration
  def change
    add_column :clients, :website, :string
  end
end
