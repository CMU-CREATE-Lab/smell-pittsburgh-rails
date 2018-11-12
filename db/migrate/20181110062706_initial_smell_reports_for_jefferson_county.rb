class InitialSmellReportsForJeffersonCounty < ActiveRecord::Migration
  def change
    reports = [
        {
          "Smell Value" => 2,
          "Smell Description" => "Rotting leaves",
          "Symptoms" => "",
          "Latitude" => 38.15229144,
          "Longitude" => -85.66836345,
          "Observed At" => 1510019741
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Wet leaves",
          "Symptoms" => "",
          "Latitude" => 38.14355944,
          "Longitude" => -85.9940035,
          "Observed At" => 1510229252
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Musty",
          "Symptoms" => "",
          "Latitude" => 38.22873959,
          "Longitude" => -85.64253891,
          "Observed At" => 1510229472
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Fresh from the rain",
          "Symptoms" => "Clear head",
          "Latitude" => 38.1851155,
          "Longitude" => -85.74286603,
          "Observed At" => 1510526320
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Burning plastic",
          "Symptoms" => "",
          "Latitude" => 38.24919357,
          "Longitude" => -85.79015837,
          "Observed At" => 1510532248
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Dust from construction; When will that hotel be complete?",
          "Symptoms" => "",
          "Latitude" => 38.25310847,
          "Longitude" => -85.73783104,
          "Observed At" => 1510584156
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Green plants keep my office smelling good",
          "Symptoms" => "",
          "Latitude" => 38.25300557,
          "Longitude" => -85.73776108,
          "Observed At" => 1510604921
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Burning plastic; Walking by a building being rehabbed",
          "Symptoms" => "",
          "Latitude" => 38.25431666,
          "Longitude" => -85.73443145,
          "Observed At" => 1510697014
        },
        {
          "Smell Value" => 5,
          "Smell Description" => "Rotting fruit",
          "Symptoms" => "Headache",
          "Latitude" => 38.19674426,
          "Longitude" => -85.82863265,
          "Observed At" => 1512050434
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Clean; Nice sunny day",
          "Symptoms" => "",
          "Latitude" => 38.2529484,
          "Longitude" => -85.73765933,
          "Observed At" => 1517426647
        },
        {
          "Smell Value" => 2,
          "Smell Description" => "Smells like acetone; strong chemical smell; Possibly coming from building construction site",
          "Symptoms" => "",
          "Latitude" => 38.25333475,
          "Longitude" => -85.74000908,
          "Observed At" => 1520277481
        },
        {
          "Smell Value" => 2,
          "Smell Description" => "Smells like pigs and straw; Smells like I am closer to the Swift plant than I am",
          "Symptoms" => "",
          "Latitude" => 38.25425179,
          "Longitude" => -85.7356796,
          "Observed At" => 1520278199
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Sewage; Beargrass Creek is full of trash and teal green at the Frankfort Ave bridge just north of Mellwood.",
          "Symptoms" => "",
          "Latitude" => 38.25636409,
          "Longitude" => -85.72099281,
          "Observed At" => 1520279554
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Strong smell of pigs; Wind has picked up",
          "Symptoms" => "",
          "Latitude" => 38.2530396,
          "Longitude" => -85.7361789,
          "Observed At" => 1520280829
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "No Butchertown smell in NuLu today.",
          "Symptoms" => "None; aich sunshine and a breeze",
          "Latitude" => 38.2534331,
          "Longitude" => -85.7359797,
          "Observed At" => 1520363660
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Spring flowers",
          "Symptoms" => "Feeling of the seasons changing",
          "Latitude" => 38.25306844,
          "Longitude" => -85.73778588,
          "Observed At" => 1523291089
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Fresh And lively",
          "Symptoms" => "",
          "Latitude" => 38.25303453,
          "Longitude" => -85.73781722,
          "Observed At" => 1523460520
        },
        {
          "Smell Value" => 5,
          "Smell Description" => "Air smells like feces; Has smeeled like this since 6:00 pm May 24",
          "Symptoms" => "",
          "Latitude" => 38.22883619,
          "Longitude" => -85.82027045,
          "Observed At" => 1527243944
        },
        {
          "Smell Value" => 4,
          "Smell Description" => "Smells like smoke; 2nd night of the awful smell!!",
          "Symptoms" => "",
          "Latitude" => 38.25120576,
          "Longitude" => -85.7038228,
          "Observed At" => 1529125905
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Chicken",
          "Symptoms" => "",
          "Latitude" => 38.21172907,
          "Longitude" => -85.76202259,
          "Observed At" => 1529446648
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Chicken",
          "Symptoms" => "",
          "Latitude" => 38.24941972,
          "Longitude" => -85.80034988,
          "Observed At" => 1529446643
        },
        {
          "Smell Value" => 2,
          "Smell Description" => "Muggy",
          "Symptoms" => "Hard to breathe",
          "Latitude" => 38.24933492,
          "Longitude" => -85.80072418,
          "Observed At" => 1529446662
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Sewer",
          "Symptoms" => "",
          "Latitude" => 38.2278504,
          "Longitude" => -85.7848,
          "Observed At" => 1529453309
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "fresh; At SDF.  Good first impression",
          "Symptoms" => "",
          "Latitude" => 38.1859129,
          "Longitude" => -85.742421,
          "Observed At" => 1529810714
        },
        {
          "Smell Value" => 1,
          "Smell Description" => "Good air.",
          "Symptoms" => "",
          "Latitude" => 38.23205071,
          "Longitude" => -85.76565959,
          "Observed At" => 1529955268
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Acrid; on 264 east at Cane Run South exit",
          "Symptoms" => "",
          "Latitude" => 38.20411549,
          "Longitude" => -85.83111013,
          "Observed At" => 1530329306
        },
        {
          "Smell Value" => 3,
          "Smell Description" => "Acrid; on 264 east at Cane Run South exit or between north and south exits",
          "Symptoms" => "",
          "Latitude" => 38.20411549,
          "Longitude" => -85.83111013,
          "Observed At" => 1530329308
        },
        {
          "Smell Value" => 5,
          "Smell Description" => "Smells like feces",
          "Symptoms" => "Sneezing",
          "Latitude" => 38.22878784,
          "Longitude" => -85.8201941,
          "Observed At" => 1531965988
        }
      ]

      reports.each do |report|
        smell_report = SmellReport.new
        smell_report.user_hash = "SMC_tester"
        smell_report.real_latitude = report['Latitude']
        smell_report.real_longitude = report['Longitude']
        smell_report.smell_value = report['Smell Value']
        smell_report.smell_description = report['Smell Description']
        smell_report.feelings_symptoms = report['Symptoms']
        smell_report.observed_at = report['Observed At']

        perturb_coordinates = SmellReport.perturbLatLng(report['Latitude'],report['Longitude'])
        smell_report.latitude = perturb_coordinates['lat']
        smell_report.longitude = perturb_coordinates['lng']

        geo = Geokit::Geocoders::GoogleGeocoder.reverse_geocode( "#{report['Latitude']}, #{report['Longitude']}" )
        smell_report.zip_code_id = ZipCode.find_or_create_by(zip: geo.zip).id

        smell_report.save
        sleep(1)
      end
  end
end