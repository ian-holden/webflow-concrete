# Webflow-Concrete

Webflow-Concrete is a complete build, development and deployment system for websites designed in Webflow that use Concrete5 for content management.

Webflow-Concrete is the "glue" that joins Webflow to Concrete5 and keeps them connected. It allow designers to create the site design and continue to maintain it using Webflow. Developers can implement any special technical back end requirements using the Concrete5 framework. The client or site editor can manage the site content using the Concrete5 CMS admin. 

**Features**

* Content maintained by end-user using Concrete5 admin
* Site design maintained by designer in Webflow
* Technical features maintained by web developer in Concrete5
* Easy configuration and "secrets" handling (for safeguarding sensitive information in the repository)
* Build for different targets (local dev, staging, live server ...)
* Deploy using rsync scripts customised for the target build.
* sensitive data (e.g. database credentials, etc.) are encrypted when stored in the repository
* Supports Concrete5 v5.6 (C5.7 coming soon) 

Please fork or clone this repository to work on your own Webflow/Concrete5 projects.

This is very much an experiment right now, and any pull requests for improvements will be appreciated.

## Dependencies

You will need nodejs, npm, Python and the Python cssutils package. 
To install these on Ubuntu for example:

```bash
sudo apt-get update
sudo apt-get install nodejs npm python python-pip
sudo pip install cssutils
```
_The actual Python packages you need to install may depend on the Python package you use. If the build fails, check the error messages for missing packages and install them using pip_

The build also expects to use a common concrete folder containing a downloaded version of concrete5. Your `local.yaml` points to the folder containing one or more versions of concrete5. Your `config.yaml` file tells the build which version of concrete5 to use, and where withing the dependencies folder it is. The build creates a symlink  from `dist/public_html/concrete` to the appropriate concrete5 version. This setup allows you to manage many concrete5 projects locally which can share the same base copy of the common concrete5 source.

Note. if you use Bower to manage common dependencies for your projects, or you clone the concrete5 repository, then the concrete5 source (in `web/concrete`) uses php short tags and you will need to enable them. See [enable php shorttags](http://stackoverflow.com/questions/2185320/how-to-enable-php-short-tags). 

Of course, a webserver e.g. Apache2 and a MySQL database are needed as usual for Concrete5.

## Basic installation

* fork webflow-concrete (optional)
* clone webflow-concrete
* sudo npm install

* cp local.sample.yaml local.yaml [ & edit path to dependencies ]
* cp secrets/src/example-secrets.yaml secrets/src/secrets.yaml [ & set any secret information needed for your site]
* define a secret key to encrypt your secrets. The key is held in an environment variable (`repos_secret` but you can change this by setting SECRETS_VAR in config.yaml). e.g. `export repos_secret=somerandomsecretstringofyourown` typically add this to .bashrc or .profile so it is always available to gulp. 
* gulp

To create a new theme folder structure:
`gulp make-new-theme --theme="SomeThemeName" --description="Brief theme description"`

* TODO explain how to setup the concrete5 dependency better
* TODO explain the config  better

## Build

    gulp

**The webroot will be in `dist/public_html` after a build**. I typically create a symlink to this folder from my local test server vhost root. 

## Clean:

    gulp clean

`gulp clean` will not clean cache files or uploaded files etc. that are within the `dist` folder, so it should not break the local website.

## Secrets

An example secrets.yaml file is provided in `secrets/src/secrets-example.yaml`  copy this file to `secrets/src/secrets.yaml` and edit it to set the values you need. Now set the encryption key you want to use in the environment variable `repos_secret`.

Secret data (database passwords etc.) that you do not want stored in the repositiory in plain text, is encrypted in `secrets/enc/secrets.yaml` for saving in the repository.  You set the values you need in `secrets/src/secrets.yaml` and these are encrypted using your secrets key which must be set in an environment variable `repos_secret`.

The actual environment variable name used to hold your secret key may be changed by changing the value of `SECRETS_VAR` in `config.yaml`. Typically, you will set the  appropriate environment variable  in `~/.profile` or `~/.bashrc`.

The build will look for `secrets/src/secrets.yaml` and if it exists, it will encrypt it to a new version of `secrets/enc./secrets.yaml`.   
Next, the build decrypts `secrets/enc/secrets.yaml` into `secrets/use/secrets.yaml`  for reference and for merging into the config settings.  not pushed to the repository.

To update the `secret.yaml` file, copy the current decrypted version form `secrets/use/secrets.yaml` to `secrets/src/secrets.yaml`, edit it and run `gulp` and it will update the version in `enc` and `use`.

If you want to Change your secret key value, set the new key value, then copy `secrets/use/secrets.yaml` to `secrets/src/secrets.yaml`,  and run `gulp`.

## Webflow Design

Use webflow to design each page type you require in C5.
Webflow page names are mapped to C5 page types as follows:

home.html -> home.php (if no home.html exists, home.php is created from index.html)
default.html -> default.php (if no default.html exists, default.php is created from index.html)
page_ name.html -> page_name.php
_if no default.php or home.php could be created because the necessary html files did not exist, they are created from the first other html processed._

**These special classes  must be used:**
* wrap the page type common header in a div with class **`c5glue-header`**
* wrap the main page content in a div with class **`c5glue-main`**
* wrap the common footer in a div with class **`c5glue-footer`**

These divs should have no styling or other classes. They are used to identify which parts of the design  should be used to create the necessary C5 page type files.

**These special classes can be used:**
* **`c5glue-nav-main`** wrap the main navigation

**Other special classes you can use:**
* **`c5glue-area-areaname`** will be replaced by C5 code defining a content area named "areaname". 
* **`c5glue-globalarea-areaname`** will be replaced by C5 code defining a global content area named "areaname". 
* **`c5glue-inc-anyname`** will be replaced by the content of file `inc/c5glue-anyname.inc.php`. This gives you a mechanism to embed your own custom php code. If you need to, a single value may be passed to the include file by placing `-var-value` after the name. e.g. class `c5glue-inc-myinc-var-foo` will use file `inc/c5glue-inc-myfile.inc.php` and any instance of `@@arg1` within the file will be replaced by `foo`.

**Special image naming conventions:**
`c5glue-var-php_variable_name.png` - any image (png,jpg etc) with this form of name will have its link changed to

`<?php echo $php_variable_name;?>` 

This allows you to use page specific images based on the C5 page name or a C5 page attribute etc.

This form can be used in html and CSS (e.g. for a background image). 

When used in CSS, some javascript is added to the footer to set the correct image as the page loads.

### Basic structure of a page in Webflow
So, the basic structure of a page must be:
```html
<html>
    <head>
        ...
    </head>
    <body>
        <div class="c5glue-header">
            ...
        </div>
        <div class="c5glue-main">
            ...
        </div>
        <div class="c5glue-footer">
            ...
        </div>
        ...
    </body>
</html>
```
### Images
All images are copied to your themes images folder

### CSS
Css files are copied into your theme css folder and all image links to `../images/*` are changed to `images/*`

The `themename.webflow.css` file is processed to extract the `typography.css` file needed for C5 content editing.

### JS
All js files are copied to your themes js folder

### Fonts
Google fonts and uploaded fonts are supported. Adobe Typekit fonts are not supported yet.

###Navigation

A sample C5 autonav template "webflow_nav" is provided. This will be used for any nav block you contain within a div class `c5glue-nav-main`. This will work if you use the following classes on the various nav elements in webflow:

w-nav, w-nav-menu, w-nav-link, w-dropdown, w-dropdown-toggle - w-icon-dropdown-toggle, w-dropdown-list, w-dropdown-link

These are the default classes that Webflow uses, and you can override them by assigning them to the appropriate elements. if you want to use different class names, you will need to change the code in the webflow_nav template, or write your own.

Note. if you have not added any class to nave elements, they may be using default classes named e.g. `Nav Link` you can simply edit these classes and change their name to e.g. `w-nav-link` and preserve and styling they have.

## Concrete5 design

A basic Concrete5 theme package is provided called "mytheme". You can use this theme, or create your own theme from it using `gulp make-new-theme --theme="SomeThemeName" --description="Brief theme description"`

If you use this gulp task, it will create the necessary package structure for your theme and edit the controller etc. with the appropriate names. After running the task, you may want to update the icons:

`packages/theme_newtheme/thumbnail.png`
`packages/theme_newtheme/themes/newtheme/thumbnail.png`

You should only run `gulp make-new-theme` once for any given theme name, as each time it is run, the new theme files will be overwritten. If you remove the package folder "theme_mytheme", gulp make-new-theme will no longer work.

###The default page type
The default page type is provided. It is constructed by the build from a few parts, some of which will come from your Webflow export, and other parts are needed for C5. You can add any special code you need to the appropriate file. You can also create other page types using the default page type as a reference (see below).

* `default.tmpl.php` - will become the default page template `default.php`
* `elements/header-default.tmpl.php` - will pull in C5 head code and webflow header content
* `elements/header-c5-default.inc.php` - the C5 specific head code. This also pulls in the fonts code from webflow
* `elements/footer-default.tmpl.php` - will pull in the webflow footer content and C5 footer code
* `elements/footer-default-c5.inc.php` - the C5 footer code


### Page types

The provided theme (mytheme), includes the default page type.  If you need more page types, these should be created as a separate page in Webflow. 

Make a copy of `default.tmpl.php` and change the line `@@import('elements/default.inc.php')` to use your page name in place of default. E.g. `@@import('elements/mynewpagetype.inc.php')`. This may be all you need to do, however, if the header or footer structure is different on this page, or this page uses fonts that are not used on the default page, you will need to copy and edit a few more files. In each case,  change 'default' to the new page name.

* `elements/header-default.tmpl.php` - copy and change references to `header-default` to `header-mynewpagetype`. 
* `elements/header-default-c5.inc.php` - copy and change `@@include('headfonts-default.inc.php')` to `@@include('headfonts-mynewpagetype.inc.php')`.
* `elements/footer-default.tmpl.php` - copy and change references to `footer-default` to `footer-mynewpagetype`. 


## How the build works

Some of the build processing is done by a python script that examins the webflow export files and creates versions of them that are compatible with Concrete5. These files are then further processed by the gulp build tasks.

The diagram below, shows how the main html and css files in the webflow export are processed to create temporary files (in gray) which are referenced by the source files provided. these source files are then built into the necessary Concrete5 files for your site. 

Any number of html pages may exist in the webflow export. One for each webflow "page". Each page represents a "page type" in concrete5. See "Page Types" above. The build will always create a default  and home page type see "Webflow design" above.

Other CSS, images, javascript and fonts not shown in the diagram are copied over to the concrete5 theme.

![Basic Build Diagram](https://s3-eu-west-1.amazonaws.com/e-email-images/build-diagram.jpg)


### use of special classes
The diagram below shows how special classes in the webflow html are used to build the equivalent Concrete5 code. index.html is shown as an example, but the same applies to any webflow page.

The only requirement is that you must wrap the main part of the page in a div with class `c5glue-main`, and the common header and footer in a div with class `c5-glue-header` and `c5glue-footer` respectively. Then optionally, warp any content that should be editable by the client with a div class `c5glue-area-areaname` where areaname is the name of that concrete5 CMS area e.g. main or sidebar etc. Any global areas you need can be wrapped in a similar way with `c5glue-globalarea-areaname`.

If you are using a fairly standard Webflow navigation block, you can warp it in `c5glue-nav-main` and that will be replaced by an autonav block that uses the provided `webflow_navbar` template.  See "Navigation" above.

You can provide code for your own custom code blocks to replace other special class names as indicated in the diagram.
use the file provided as a guide.

![Special Classes Diagram](https://s3-eu-west-1.amazonaws.com/e-email-images/special-classes-diagram.jpg)

## Sample 

The package includes a sample Webflow design based on the simple single page Slate theme. This theme has been modified to use most of the features including use of `c5glue-nav-main` for the navigation. Editable Content Areas: hero, main, gallery, friends. And, a global footer area: footer_content. The sample is called "webflowconcrete" and is in folder `webflow/sample`.

## Deploying to target using rsync the scripts provided

**TODO** see README.md in scripts folder

## Backup files and database using the scripts provided

**TODO** see README.md in scripts folder

