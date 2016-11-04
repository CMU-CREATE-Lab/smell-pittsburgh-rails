set :stage, :production

set :ssh_username, ask("login:")

server '192.168.56.155', user: fetch(:ssh_username, "login:"), roles: [:web]

role :web, %w{192.168.56.155}
