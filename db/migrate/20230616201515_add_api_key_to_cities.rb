class AddApiKeyToCities < ActiveRecord::Migration
  def change
    add_column :cities, :api_key, :string
  end
end
