# config valid only for current version of Capistrano
lock '3.5.0'

set :application, 'smellpgh'
set :deploy_to, "/var/www/rails-apps/#{fetch(:application)}/#{fetch(:stage)}"

set :scm, :git
set :repo_url, 'https://github.com/CMU-CREATE-Lab/smell-pittsburgh-rails.git'
set :branch, "master"
set :repo_path, "#{fetch(:deploy_to)}/repo"


namespace :deploy do


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
      end
    end
  end

end
