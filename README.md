# Site Starter for on Concrete5 and Webflow.

This is the master repository and contains several C5/webflow based projects in different branches.

Fork this repository to create a new project.

Branches:

**master** - the current working version
webflow - normal webflow and Concrete 5.6
c5.7 - (not created yet, will be for webflow on Concrete 5.7
Get a full clone using

    git clone git@bitbucket.org:ianholden/igh-starter-c5-webflow.git



---

# Using this repository

## ENV variable repos_secret MUST BE SET

Secret data is encrypted in `secret/enc` folder and can only be decrypted if the `repos_secret` environment variable is set correctly in `.profile` or similar.
Other folders `secret/src` and `secret/use` must be excluded form the repository.

To update the `secret.yaml` file, copy the decrypted version form `secret/use` to `secret/src`, edit it and run `gulp` and it will update the encrypted version in `secret/enc`.

## Build

    gulp

## Clean:

    gulp clean

## The webroot will be in `dist/public_html` after a build


## Basic setup

* fork igh-starter-c5-webflow (ONLY IF YOU ARE STARTING A NEW PROJECT)
* clone
* sudo npm install
* cp local.sample.yaml local.yaml [ & edit path to dependencies ]
* gulp
* `mkdir secrets/src && cp secrets/use/secrets.yaml secrets/src/` [ & edit `secrets/src/secrets.yaml`]

**and these steps may be needed if refactoring form an older style repository or project**

* copy packages and maybe blocks and other folders specific to the project
* copy `public_html/files/` to `dist/public_html/files/` [excluding temp and cache etc.]
* put edit `config.yaml` with settings taken from `_private/site_backus/eno_site_backup2.cfg.pl` [ & other places TBD]
* de-link the theme folder - remove theme link, and copy package/themes/theme folder to replace the theme symlink [you could rename the theme to be mytheme and merge with the upstream code to possibly simplify future merging of upstream changes, but this may actually make things harder in the future. Not sure.]
* copy any example scripts needed from `scripts/examples/*` into `scripts/*`
* make sure the apache vhost config allows php shortcodes ( php value short_open_trag 1) [because bootstrap files in the repository use shortcodes (their builds don't) see the bootstrap README.md]

## config files:

* **local.yaml** - defines local path to dependencies and the default target (not in repos)
* **config.yaml** - main project configuration for all targets
* **secrets/src/secrets.yaml** - secret project configuration for all targets (encrypted in the repository)

The build will insert tokens form the configuration into certain files based on the target.
This is how the sync scripts, backup scripts and other site config files get populated with the appropriate values for the target.

The default target can be overridden by specifying it on a build e.g.

`gulp --target=live`

---

## Docs

* [Google Docs Folder](https://drive.google.com/folderview?id=0B-QgHwm-NQ-4ZG9aQVcwZlZ5aVE&usp=sharing)

---

# Example steps to create a new site

**TBD**

---

# Sync scripts

Example sync scripts using rsync and lftp are in scripts/examples.
Move these to scripts up to scripts/ and modify for each site as needed.

* copy any example scripts needed from `scripts/examples/*` into `scripts/*`

# Backup Scripts

These are in public_html_private/site_backups
Copy eno_site_backup2.cfg.example.pl to eno_site_backup2.cfg.pl and edit with your config.


# Password protection within the repository

All passwords or secret information should be placed into secrets folder.
Only `secrets/enc/secrets.yaml` is stored in the repository in encrypted form.
Any build will decrypt this file into `secrets/use/secrets.yaml`.

To update secrets, edit `secrets/use/secrets.yaml`, save it to `secrets/src/secrets.yaml` and build. The build will encrypt the **src** file into **enc**. 


# Concrete5 version location

The concrete folder in the site build will be a symlink to the appropriate C5 version in the dependencies project.

# making a new theme

* rename `packages/theme_mytheme` to `packages/theme_xxxx`
* edit `packages/theme_xxxx/controller.php` and change mytheme to xxxx keeping case consistent
* edit `packages/theme_xxxx/icon.png` for this theme
* edit `packages/package/themes/theme/description.txt` and change mytheme to xxxx
* edit `packages/package/themes/theme/thumbnail.png` for the theme

Now a basic theme is available. 

* Install it from C5 dashboard: Extend Concrete5 > install
* then activate the theme from Pages & Themes > Themes

[more info here](https://docs.google.com/document/d/1LMEpkpX0AXMSkcmoRosPwrEoM3gKahLcFDSK9VOC4WM/edit#)


# build system

The build system is based on gulp, and npm.

Initialise the project by running `sudo npm install`. You may need to rerun this command after merging in updats from the upstream repository.

The build destination is the `dist` folder, so any vhost configuration for this site should be pointing at `dist/pub;lic_html`.
Rsync scripts for syncing to servers will be in `dist/scripts` with the appropriate configuration for the target.

In sublime text, you can use ctrl-B to build, but first, add this to xxxx.sublime-project file:

```json
	,
	 	"build_systems":
	    [
	        {
	            "name": "gulp",
	            "cmd": ["gulp"],
	            "working_dir": "${project_path:${folder}}"
	        },
	        {
	            "name": "gulp clean",
	            "cmd": ["gulp", "clean"],
	            "working_dir": "${project_path:${folder}}"
	        }        
	    ]
```

then tools > build System > select "build css"

---
