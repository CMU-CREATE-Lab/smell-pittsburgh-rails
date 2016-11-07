set :stage, :production

set :ssh_username, ask("login:")

server 'api.smellpittsburgh.org', user: fetch(:ssh_username, "login:"), roles: [:web]

role :web, %w{api.smellpittsburgh.org}
