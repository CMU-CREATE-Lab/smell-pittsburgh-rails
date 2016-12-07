# config valid only for current version of Capistrano
lock '3.5.0'

# app/deployment info
set :application, 'smellpgh'
set :deploy_to, "/var/www/rails-apps/#{fetch(:application)}/#{fetch(:stage)}"

# shared resources
set :linked_dirs, %w(log public/system)
set :linked_files, %w(config/database.yml config/secrets.yml config/environment.rb config/environments/production.rb)

# git/version control info
set :scm, :git
set :repo_url, 'https://github.com/CMU-CREATE-Lab/smell-pittsburgh-rails.git'
set :branch, "master"
set :repo_path, "#{fetch(:deploy_to)}/repo"

# RVM: you can specify your ruby version here, or specify to use RVM's default ruby version (recommended since this is probably the version that production is currently at)
# set :rvm1_ruby_version, "2.2.5"
set :rvm1_ruby_version, "default"


# deploy tasks
namespace :deploy do


  # remove the RVM scripts that capistrano creates (breaks when trying to chmod from someone else)
  before "rvm1:hook", :remove_rvmscripts do
    on roles(:web) do
      sudo(:rm,"-rf","#{fetch(:deploy_to)}/rvm1scripts")
    end
  end


  # ASSERT: group 'rvm' exists and all deploy users are members
  before :starting, :fix_permissions do
    on roles(:web) do
      begin
        within "#{fetch(:deploy_to)}" do
          sudo(:chown, "-R", "#{fetch(:ssh_username)}:rvm", "#{fetch(:deploy_to)}")
        end
      rescue
        puts "Directory #{fetch(:deploy_to)} DNE; skipping."
      end
      begin
        within "#{fetch(:tmp_dir)}" do
          sudo(:chown, "-R", "#{fetch(:ssh_username)}:rvm", "#{fetch(:tmp_dir)}")
        end
      rescue
        puts "Directory #{fetch(:tmp_dir)} DNE; skipping."
      end
    end
  end


  after :started, :uninit_git_dir do
    begin
      on roles(:web) do
        within "#{fetch(:repo_path)}" do
          execute(:git, "config", "--unset", "core.logallrefupdates")
          execute(:git, "config", "--unset", "core.worktree")
          execute(:git, "config", "core.bare", "true")
        end
      end
    rescue
      puts "Directory #{fetch(:repo_path)} DNE; skipping uninit_git_dir (NOTE: this should only happen the first time the repo is deployed to the server; otherwise, something terrible probably happened)"
    end
  end


  after :finished, :reinit_git_dir do
    on roles(:web) do
      within "#{fetch(:deploy_to)}/current" do
        execute(:git, "init", "--separate-git-dir=#{fetch(:repo_path)}")
        execute(:mkdir,"-p","tmp")
        sudo(:chmod, "-R", "777", "tmp")
        execute(:rake, "assets:precompile")
        sudo(:chown, "-R", "#{fetch(:ssh_username)}:rvm", "#{fetch(:deploy_to)}")
        execute(:touch,"tmp/restart.txt")
      end
    end
  end

end
