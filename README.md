Smell Pittsburgh Rails Server
=============================

A simple API for sending and receiving Smell Reports, powered by Rails.

Runs on **rails 4.2.10** using **ruby v2.2.5**.

## Requesting Smell Reports

Issue the following request to receive smell reports:

    curl http://localhost:3000/api/v1/smell_reports

Responses will look like:

```json
[
  {
    "latitude" : 40.4406248,
    "longitude" : -79.9958864,
    "smell_value" : 1,
    "smell_description" : "Description of the smell",
    "feelings_symptoms" : "Symptoms or feelings associated with the smell",
    "created_at" : "2016-03-29T15:49:53.000Z"
  },
  ...
]
```

By default, this will retrieve all smell reports (for now). Plans for future releases:

* Query by latitude/longitude
* Sorting results

## Uploading new Smell Reports to the server

You can upload new smell reports using the following form:

```json
{
  "user_hash" : "someuniquehash",
  "latitude" : 40.4406248,
  "longitude" : -79.9958864,
  "smell_value" : 1,
  "smell_description" : "Description of the smell",
  "feelings_symptoms" : "Symptoms or feelings associated with the smell",
  "submit_achd_form" : true
}
```

Then issue the curl command:

    curl -X POST -H "Content-Type:application/json" http://localhost:3000/api/v1/smell_reports -d @smell_report.json

The fields **user_hash**, **latitude**, **longitude**, and **smell_value** are required fields.

## Capistrano and Deployment

This repository uses the **capistrano** rubygem for deployment. The version number (3.5.0) was chosen for consistency with other repositories that use older ruby versions (ruby-1.9.3).

#### A quick run-through of capistrano

To begin deployment with capistrano, a user runs the capistrano command:

```
capistrano production deploy
```

They will then be prompted to enter their username and password for the production server (capistrano uses local username by default, but I added the prompt for my own preference). After entering the proper credentials, capistrano uses **ssh** to run `git clone --mirror` and mirror the repository to the production server. If it is already mirrored, it will try to update the repository. Finally, it will copy files from the _master_ branch, update the current symlink, and restart the server.

**NOTE:** For the first deployment, you will have to manually copy the repository's linked_files (`config/database.yml` `config/secrets.yml` `config/environment.rb` `config/environments/production.rb`) into the capistrano `shared` directory.

#### Capistrano config, in greater detail

It is important to understand the structure that capistrano imposes on the deployment path. A sample is listed below. You can also learn more about this [here](http://capistranorb.com/documentation/getting-started/structure/).

```
├── current -> (symlink to one of the releases dirs)
├── releases
│   └── ...
├── repo
├── revisions.log
└── shared
```

So, why is any of this relevant? Well, by the process that **capistrano** by default, it will generate a tarball from the git repository using the `git archive` command, then untar the files into a timestamped folder in the `releases` directory, which is then symlinked to the `current` directory. However, none of this process involves recloning the git repository itself, and the archived files will only contain a git **work tree** and not another **git directory** (see below for more details about these terms).

In summary: you cannot run `git status` or other `git` commands easily within the `current` directory. And this is annoying.

#### Our workaround

To solve this problem, we have to add a few extra commands to our **capistrano** scripts. The main point is to "initialize" our `current` directory as a git repository. But this this isn't a new repository, we instead have to just tell it where it can find the proper **git directory**. This can be accomplished by running the following command within the `current` (**working tree**) directory:

```
git init --separate-git-dir=/path/to/cap-deploy-dir/repo/
```

This alone will allow us to run `git` commands from the `current` directory without having to specify extra flags every time to point to a different **git directory**. However, this will cause problems when trying to deploy to the server after the first time. In summary, this is because the configuration file in `repo/config` needs to be reset, and this can be accomplished by running the following in the `repo` directory:

```
git config --unset core.logallrefupdates
git config --unset core.worktree
git config core.bare true
```

This, unfortunately, will introduce a few quirks to the deployed directory. For the first time the code is deployed, the `git status` will display everything as staged to be deleted and all files as untracked. This can be fixed simply by running `git add -A`. It is also important to note that the **git directory** is not in the location that git uses by default, but this should be very clear to anyone who actually read all of this documentation.

#### Git background

To understand why this is necessary, some esoteric knowledge of **git** will come in handy. In **capistrano**'s directory structure, the `repo` directory is where the unreadable git repository "data" lives. However, this directory does not contain the **work tree** (the directory that contains all of the actual *project's files* that make up the repository). Rather, this is the bare **git directory** (which normally is the hidden `.git` directory that is created when you clone a git repository). You can learn more about the vocabulary and environment variables in [the git docs](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables#Repository-Locations). There is also a nice visual of the "three states" that git files can be in locally, located [here](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics#The-Three-States).
