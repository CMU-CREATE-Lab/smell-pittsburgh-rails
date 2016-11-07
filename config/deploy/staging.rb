set :stage, :staging

set :ssh_username, ask("login:")

set :branch, "deploy-staging"

server 'api.smellpittsburgh.org', user: fetch(:ssh_username, "login:"), roles: [:web]

role :web, %w{api.smellpittsburgh.org}
