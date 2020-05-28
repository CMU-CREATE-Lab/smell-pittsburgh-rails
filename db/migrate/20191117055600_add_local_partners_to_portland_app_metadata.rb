class AddLocalPartnersToPortlandAppMetadata < ActiveRecord::Migration
  def change
    city_obj = City.find(3)
    city_obj.app_metadata = {
      "side_menu_background_url" => "/img/app-images/side-menu-backgrounds/portland-or.png",
      "side_menu_background_color" => "#24bab1",
      "local_partners_content" => "<h3>Portland</h3><p>Our Portland pilot is made possible with support from Portland Clean Air.</p><p><u>Portland Clean Air</u><br>By filing government information requests over the past five years, <a href='http://portlandcleanair.org/' target='_blank'>Portland Clean Air</a> has obtained the data from eight agencies that regulate air pollution in the Portland area. We use statistics software, GIS mapping, Google mapping, computer programming, research, and web design to make this data understandable to everyone. When we began, Portland was ranked as the worst city in America for respiratory distress from air pollution by the EPA. Currently we are ranked by the EPA in the worst 1.3% of counties in the US for diesel particulate, the worst airborne carcinogen according to State of California risk assessments. Portland Clean Air is a nonprofit organization supported by 4,200 local donors. We work with 38 Portland Neighborhood Associations, 24 Portland area churches and synagogues, and two Washington County Citizen Participation Organizations to address smokestack pollution, unfiltered diesel emissions, wood smoke, and airborne lead from piston aircraft and unregulated demolitions.</p>"
    }
    city_obj.save!
  end
end
