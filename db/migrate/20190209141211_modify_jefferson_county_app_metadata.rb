class ModifyJeffersonCountyAppMetadata < ActiveRecord::Migration
  def change
    city_obj = City.find_by_name("Louisville")
    city_obj.app_metadata = {
      "side_menu_background_url" => "/img/app-images/side-menu-backgrounds/louisville-ky.png",
      "side_menu_background_color" => "#24bab1",
      "smell_description_placeholder_text" => "chemical, sewer-like, flowery, burnt",
      "additional_notes_placeholder_text" => "e.g. short-term vs. long-term pollution issue; multiple submissions in the same day"
    }
    city_obj.save!
  end
end
