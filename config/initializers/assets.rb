# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )
Rails.application.config.assets.precompile += %w( CustomMapMarker.js )
Rails.application.config.assets.precompile += %w( AnimateCustomMapMarker.js )
Rails.application.config.assets.precompile += %w( TimelineHeatmap.js )
Rails.application.config.assets.precompile += %w( TimelineHeatmap.css )
Rails.application.config.assets.precompile += %w( googleAnalytics.js )
Rails.application.config.assets.precompile += %w( postmessage.js )
Rails.application.config.assets.precompile += %w( summary.js )
Rails.application.config.assets.precompile += %w( controls.css )
Rails.application.config.assets.precompile += %w( widgets.css )
Rails.application.config.assets.precompile += %w( widgets.js )
Rails.application.config.assets.precompile += %w( visualization.js )
Rails.application.config.assets.precompile += %w( visualization.css )
Rails.application.config.assets.precompile += %w( summary.js )
Rails.application.config.assets.precompile += %w( summary.css )
Rails.application.config.assets.precompile += %w( CalendarHeatmap.js )
Rails.application.config.assets.precompile += %w( CalendarHeatmap.css )
Rails.application.config.assets.precompile += %w( moment.min.js )
Rails.application.config.assets.precompile += %w( d3.v3.min.js )
Rails.application.config.assets.precompile += %w( array-map-set-polyfill.min.js )
Rails.application.config.assets.precompile += %w( infobox.js )
#Rails.application.config.assets.precompile += %w( feed.js )
#Rails.application.config.assets.precompile += %w( feed.css )

# Now any manifest with *-bundle will be loaded and we never have to worry about precompiling under production
Rails.application.config.assets.precompile += %w(*-bundle.* *.jpg *.png *.jpeg *.gif)
