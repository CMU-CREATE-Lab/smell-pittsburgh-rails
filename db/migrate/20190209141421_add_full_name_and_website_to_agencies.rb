class AddFullNameAndWebsiteToAgencies < ActiveRecord::Migration
  def change
    add_column :agencies, :website, :string
    add_column :agencies, :full_name, :string
  end
end
