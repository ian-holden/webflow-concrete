/*
gulp build for c5-webflow-starter project

The dependencies should be in package.json, so to get them all, run

sudo npm install

if you add more dependencies, run:
sudo npm install --save new-dependency
this will install the new dependency and update the package.json


to build this project:
gulp

--target=xxx    can be used to override the target in your local.yaml file
                in order to force the build to be for a different target from that in the currently checked out code

to clean before a re-build e.g. after updating a dependency:
gulp clean

 */
var gulp = require('gulp');
var changed = require('gulp-changed');
var del = require('del');
var yargs = require("yargs").argv;
var rename = require("gulp-rename");
var encrypt = require("gulp-simplecrypt").encrypt;
var decrypt = require("gulp-simplecrypt").decrypt;
var runSequence = require('run-sequence');
var _yaml = require('require-yaml');
var token_replace = require('gulp-token-replace');
var debug = require('gulp-debug');
var mkdirp = require('mkdirp');
var gulpFilter = require('gulp-filter');
//var less = require('gulp-less');
var concat = require('gulp-concat');
var symlink = require('gulp-symlink');
var merge = require('merge');
var gutil = require('gulp-util');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var file_include = require('gulp-file-include');
var exec = require("sync-exec");
var replace = require('gulp-replace');
var changeCase = require('change-case')
var merge_stream = require('merge-stream');
var watch = require('gulp-watch');
var plumber = require('gulp-plumber');
var batch = require('gulp-batch');
var concat = require('gulp-concat');

// for extract_typography (webflow only):
var rework = require('rework'),
    css = require('css'),
    read = require('fs').readFileSync,
    write = require('fs').writeFileSync;



var DBG=false;

var error_count=0;

var local = require('./local.yaml'); // local config has dependency path and target - don't commit to repository.
var config_all = require('./config.yaml'); // here are our main config variables for each environment

var secret_key; // will be set after reading config and the specified env variable (by secrets_update task)

// determine which config vars to use based on the target value
var target_default = local.target || 'normal';

// override with command line parameter target if set
var target = yargs.target || target_default;

var config;
var theme_path;
var webflow_path;

// override gulp.src to always use plumber, ,so watch task will not kill gulp on errors

var gulp_src = gulp.src;
gulp.src = function() {
  return gulp_src.apply(gulp, arguments)
    .pipe(plumber(function(error) {
      // Output an error message
      gutil.log(gutil.colors.bgRed('Error (' + error.plugin + '): ' + error.message));
      error_count++;
      // emit the end event, to properly end the task
      this.emit('end');
    })
  );
};


gulp.task('watch', function () {
    watch([
        'public_html/**',
        'webflow',
        'slate',
        '*.yaml',
        '/secrets/src/secrets.yaml'
        ], batch(function (events, done) {
        //console.log(events);
        var eventsList = events._list;
        var eventsCount = eventsList.length;
        gutil.log(gutil.colors.bgGreen(eventsCount + " FILES CHANGED (list below) - TRIGGERING BUILD"));
        for (var i = 0; i < eventsCount; i++) {
            var vfile = eventsList[i]; // thsi is a vinyl file object
            gutil.log(gutil.colors.green(vfile.path));
        }
        gulp.start('default', done);
    }));
});


// copy mytheme package structure to a new theme package
// usage gulp make-new-theme --themename="new name" --description="theme description"
// themename will be converted into a lowercase theme name variable name using underscores to separate words
// e.g. "New Name" will be changed to "new_name" and used as the theme folder name
// the package folder name will be theme_new_name.
// The controller and description files will be changed for the new theme
// icon files may need to be manually updated if necessary
gulp.task('make-new-theme', function(done) {

    var themename = yargs.themename || 'new theme';
    var description = yargs.description || "description of theme: "+themename;

    var cleanname = changeCase.lowerCase( changeCase.constantCase(themename));
    var pascalname = changeCase.pascalCase(cleanname);
    gutil.log(gutil.colors.bgCyan("Making new theme '" + cleanname + "' (" + description + ")"));

    var package_path = 'public_html/packages/theme_' + cleanname;
    var theme_path = package_path + '/themes/'+cleanname;
    var src_package_path = 'public_html/packages/theme_mytheme';
    var src_theme_path = src_package_path + '/themes/mytheme';

    var ctrl_filter = gulpFilter(['controller.php']);
    var descr_filter = gulpFilter(['description.txt']);

    // do the package files excluding the themes folder (which must be in a different location)
    gutil.log(gutil.colors.bgCyan("Making new package in '" + package_path + "'"));
    package_files = gulp.src([src_package_path+'/**/*','!'+src_package_path+'/themes/**/*'], {base: src_package_path})
        .pipe(ctrl_filter)

        //.pipe(debug({title: 'pkg filtered:'}))

        .pipe(replace('Installs Mytheme theme',description))
        .pipe(replace('mytheme',cleanname))
        .pipe(replace('Mytheme',pascalname))

        .pipe(ctrl_filter.restore()) // restore all unfiltered files to the stream
        //.pipe(debug({title: 'pkg unfiltered:'}))
        .pipe(gulp.dest(package_path));

    // do the themes files excluding the themes folder (which must be in a different location)
    gutil.log(gutil.colors.bgCyan("Making new theme in '" + theme_path + "'"));
    themes_files = gulp.src(src_theme_path+'/**/*',{base: src_theme_path})
        .pipe(descr_filter)

        //.pipe(debug({title: 'theme filtered:'}))
        .pipe(replace('mytheme',cleanname))

        .pipe(descr_filter.restore()) // restore all unfiltered files to the stream
        //.pipe(debug({title: 'theme unfiltered:'}))
        .pipe(gulp.dest(theme_path));

    return merge_stream(package_files, themes_files);

});




gulp.task('default', function(done) {
  runSequence('prep',
              'main-processing',
              done);
});


// load the config and set some global variables
gulp.task('prep', function(done) {

    error_count=0;

    // load the target config
    gutil.log(gutil.colors.bgCyan("-------------------------------------------------------------"));
    gutil.log(gutil.colors.bgCyan("--- STARTING BUILD FOR TARGET: " + target));
    gutil.log(gutil.colors.bgCyan("-------------------------------------------------------------"));

    if(target != 'normal'){
        config = merge.recursive(true, config_all['normal'], config_all[target]);
    }else{
        config = config_all['normal'];
    }
    theme_path = 'public_html/packages/theme_' + config.THEME + '/themes/' + config.THEME ;
    webflow_path = 'webflow/' + config.WEBFLOW_FOLDER;

    // add BUILD_TARGET (target) to the config so some scripts can use it as a token
    if (typeof config.BUILD_TARGET == "undefined") {
        config.BUILD_TARGET = target;
        gutil.log("BUILD_TARGET set to '" + target + "' as it is not in the config.");
    }
    gutil.log("config.BUILD_TARGET is '" + config.BUILD_TARGET + "'");
    done();
});


gulp.task('main-processing',[ 'compress-css', 'compress-js', 'tokens', 'templates', 'c5-make-root-empty-folders', 'c5-link'], function (done) {

    if(DBG){
        gutil.log("config merged:");
        gutil.log(config);
    }
    if(error_count > 0){
        gutil.log(gutil.colors.bgRed("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"));
        gutil.log(gutil.colors.bgRed("!!! FAILED! WITH " + error_count + " ERRORS!  TARGET: "+target));
        gutil.log(gutil.colors.bgRed("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"));
        gutil.beep();
    }else{
        gutil.log(gutil.colors.bgGreen("-------------------------------------------------------------"));
        gutil.log(gutil.colors.bgGreen("--- FINISHED BUILD FOR TARGET: "+target));
        gutil.log(gutil.colors.bgGreen("-------------------------------------------------------------"));
    }
    done();
});



// Clean
gulp.task('clean', ['clean-dist'], function(cb) {
    // clean folders other than dist
    var dellist = [
        'temp/**',
        'secrets/src/**',
        'secrets/use/**',
        '!secrets/src',
        '!secrets/src/example-*'
        ];
    if(config.THEME != 'mytheme'){
        // also remove the theme_mytheme package folders when we are not using them
        dellist.push('dist/public_html/packages/theme_mytheme/**');
    }
    del(dellist, cb);
});


// Clean all of dist except website content logs and backups etc.
gulp.task('clean-dist',['prep'], function(cb) {
    // everything except public_html
    del([
        'dist/**/*', // delete everything in dist except:
        
        '!dist/public_html', // don't delete folder public_html before we get in to look at its contents
        '!dist/public_html/files', // leave the files folder
        '!dist/public_html/files/**/*', // leave the files folder contents

        // other folders that contain logs: (include each folder on the way)
        '!dist/public_html/log',

        '!dist/public_html/_private',
        '!dist/public_html/_private/site_backups',

        '!**/*.log' // don't delete any log files (this will only apply within foldersthat are not deleted, so must also exclude any folders that contain logs)
        ], cb);
});





// symlink to the correct C5 dependency
gulp.task('c5-link', function() {
    var SRC = local.dependencies_path + config.depend.c5.VERSION + '/' + config.depend.c5.BASE;
    var DEST = config.depend.c5.DEST;
    gutil.log("c5l SRC: '"+SRC+"'");
    gutil.log("c5l DEST: '"+DEST+"'");
    del.sync(DEST);
    gulp
        .src(SRC)
        .pipe(symlink(DEST,{force: true}));
});


// copy over all webflow files
// html files are analysed by a python script and split into the parts needed for C5
// the main css file is analysed and a script is created to handle dynamic images identified by names starting "c5glue-var-"
// Gulp tasks corrcet paths to images and fonts to be suitable for Concrete5
gulp.task('webflow-import', ['webflow-css', 'webflow-js', 'webflow-images', 'webflow-fonts'], function(done) {
    var cmd = 'python webflow_to_c5.py -t "' + config.THEME + '" -w "' + webflow_path + '" -n "' + config.WEBFLOW_NAME + '"';
    gutil.log(gutil.colors.bgYellow("running: " + cmd));
    var result = exec(cmd);
    gutil.log(gutil.colors.yellow("\n" + result.stdout + "\n"));
    if(result.stderr != ''){
        gutil.log(gutil.colors.red("\n" + result.stderr + "\n"));
    }
    if(result.status != 0){
        gutil.log(gutil.colors.red("\nERROR! python webflow_to_c5.py FAILED! Status code " + result.status + "\n"));
        error_count++;
    }
    done();
});


gulp.task('webflow-css', function(){
  var DEST = 'dist/' + theme_path + '/css';
  //gutil.log("=====> Copying webflow css to: "+DEST);
  return gulp.src([webflow_path + '/css/*.css'])
    .pipe(changed(DEST))

    //.pipe(debug({title: 'webflow-css:'}))

    .pipe(replace(/url\((["']?)\.\.\/images\/(.*?)(["']?)\)/g, 'url(images/$2)'))
    // also correct links to font files
    .pipe(replace(/url\((["']?)\.\.\/fonts\/(.*?)(["']?)\)/g, 'url($1fonts/$2$1)'))

    .pipe(gulp.dest(DEST))
});

gulp.task('webflow-images', function(){
  var DEST = 'dist/' + theme_path + '/images';
  //gutil.log("=====> Copying webflow images to: "+DEST);
  return gulp.src([webflow_path + '/images/**/*'])
    .pipe(changed(DEST))

    //.pipe(debug({title: 'webflow-images:'}))

    .pipe(gulp.dest(DEST))
});

gulp.task('webflow-fonts', function(){
  var DEST = 'dist/' + theme_path + '/fonts';
  //gutil.log("=====> Copying webflow fonts to: "+DEST);
  return gulp.src([webflow_path + '/fonts/**/*'])
    .pipe(changed(DEST))

    //.pipe(debug({title: 'webflow-fonts:'}))

    .pipe(gulp.dest(DEST))
});

gulp.task('webflow-js', function(){
  var DEST = 'dist/' + theme_path + '/js';
  //gutil.log("=====> Copying webflow js to: "+DEST);
  return gulp.src([webflow_path + '/js/**/*'])
    .pipe(changed(DEST))

    //.pipe(debug({title: 'webflow-js:'}))

    .pipe(gulp.dest(DEST))
});




// templates
// process each .tmpl.php file, pulling in any .inc.php files referenced by them
// e.g. .../header.tmpl.php => .../header.php
// this is done in the dist folder structure
gulp.task('templates', ['templates-main'], function(done){
  // delete the .tmpl. and .inc. files not needed after the template processing
  var SRC = ['dist/public_html/packages/theme_' + config.THEME + '/**/*.tmpl.php',
    'dist/public_html/packages/theme_' + config.THEME + '/**/*.inc.php'];
  del(SRC,done);
});

gulp.task('templates-main', ['duplicate-inc-in-elements', 'base-files','webflow-import'], function(){

  var SRC = ['dist/public_html/packages/theme_' + config.THEME + '/**/*.tmpl.php'];
  var DEST = './';
  return gulp.src(SRC, {base: './'})
  .pipe(file_include({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(rename(function (path) {
        path.basename = path.basename.substr(0,path.basename.length-5); // strip off .tmpl from end
     }))

    //.pipe(debug({title: 'includes created:'}))

    .pipe(gulp.dest(DEST))
});


// tokens - make any token substitutions to target specific files (always do these as the target may change)
gulp.task('tokens',['base-files', 'load-secrets'], function(){
  var DEST = 'dist';
  var token_filter = ['public_html/config/*', 'scripts/*'];
  //gutil.log("=====> Applying tokens for target: "+target+" to these files:");
  return gulp.src(token_filter, {base: './'})
    //.pipe(debug({title: 'token-file:'}))
    .pipe(token_replace({global:config})) // toknise filtered files only
    .pipe(gulp.dest(DEST))
});


// base-files - our source is copied to dist before any token mods are applied from the dependencies
gulp.task('base-files', function(){
  var DEST = 'dist';
  return gulp.src([
    'public_html/**',
    'scripts/**',
    '!**/*.less',
    '!**/examples', '!**/examples/**',
    '!**/*.sample.*'
    ], {base: './'})
    .pipe(changed(DEST))

    .pipe(gulp.dest(DEST))
});


// duplicate-inc-in-elements - copy the inc folder into elements folder to simplify our template processing
gulp.task('duplicate-inc-in-elements',['base-files'], function(){
  var SRC = 'dist/' + theme_path + '/inc/**';
  var DEST = 'dist/' + theme_path + '/elements/inc';
  return gulp.src(SRC)
    .pipe(gulp.dest(DEST))
});





// clean a path made of three parts so there is no leading / and no double / (//)
function make_relative_path(dist,dest,glob){
    var path=dist+'/'+dest+'/'+glob;
    //gutil.log("mrp:  in:"+path);
    path = path.replace(/\/\//,'/');
    path = path.replace(/^\//, "");
    //gutil.log("mrp: out:"+path);
    return path;
}

function copy_files(srcpath, BASE, FILES, DEST){
    // BASE must be / or /path/
    BASE = BASE.match(/^\/?(.*?)\/?$/)[1]; // remove leading and trailing slashes
    if(BASE == '') {BASE='/';} else {BASE = '/' + BASE + '/';} // surround with slashes

    var SRC = [];
    for (i = 0; i < FILES.length; ++i) {
        SRC[i] = srcpath + BASE + FILES[i];
    }
    BASE = srcpath + BASE;

    if(DEST == '') {DEST='./';}

    if(DBG){
        gutil.log("DEST:" + DEST);
        gutil.log("BASE:" + BASE);
        gutil.log("FILES:" + FILES);
        gutil.log("SRC:" + SRC);
    }

    return gulp.src(SRC, {base: BASE})
        .pipe(changed(DEST))
        // will only copy files changed since the last time it was run
        //.pipe(debug({title: 'unicorn:'}))
        .pipe(gulp.dest(DEST))
        //.on('end',done)
        ;
}


function token_files(srcpath, BASE, FILES, DEST, FILTER){
    // BASE must be / or /path/
    BASE = BASE.match(/^\/?(.*?)\/?$/)[1]; // remove leading and trailing slashes
    if(BASE == '') {BASE='/';} else {BASE = '/' + BASE + '/';} // surround with slashes

    var SRC = [];
    for (i = 0; i < FILES.length; ++i) {
        SRC[i] = srcpath + BASE + FILES[i];
    }
    BASE = srcpath + BASE;

    if(DEST == '') {DEST='./';}

    var filter = gulpFilter(FILTER);

    if(DBG){
        gutil.log("DEST:" + DEST);
        gutil.log("BASE:" + BASE);
        gutil.log("FILES:" + FILES);
        gutil.log("SRC:" + SRC);
        gutil.log("FILTER:" + FILTER);
    }

    return gulp.src(SRC, {base: BASE})
        .pipe(filter)

        //.pipe(debug({title: 'filtered:'}))

        .pipe(token_replace({global:config})) // toknise filtered files only
        .pipe(filter.restore()) // restore all unfiltered files to the stream
        .pipe(gulp.dest(DEST))
        //.on('end',done)
        ;
}


// read and decrypt secrets into the config:

gulp.task('load-secrets', function(done) {
  runSequence('secrets_update',
              'secrets_decrypt',
              'secrets_set',
              'secrets_clean',
              done);
});

// encrypts modified secrets/src/secrets.yaml to secrets/enc/secrets.yaml
gulp.task('secrets_update', function (done) {
    var dest = 'secrets/enc';
    del.sync(['secrets/use/**']); // delete the use versions in case something goes wrong
    secret_key = process.env[config.SECRETS_VAR]; // get the decrypt key from the configured env var
    if (typeof secret_key == 'undefined' || secret_key == '') {
      // error
      gutil.log(gutil.colors.bgRed("Error no secrets key is set in environment variable '" + config.SECRETS_VAR + "'. "
        + "Check config.yaml sets SECRETS_VAR to the env var name, and that that env var is set to your secrets key."));
      error_count++;
      // emit the end event, to properly end the task
      done();
    }else{

      gulp.src("secrets/src/secrets.yaml", {base:'secrets/src'})
          .pipe(changed(dest))
          .pipe(encrypt({
              password: secret_key
          }))
          .pipe(gulp.dest(dest))
          // when stream ends, call callback
          .on('end', done);
    }
});
 
// decrypts secrets/enc/secrets.yaml to secrets/use/secrets.yaml
gulp.task('secrets_decrypt', function (done) {
    if (typeof secret_key == 'undefined' || secret_key == '') {
      // skip if no secret_key. Error already issued
      done();
    }else{

      var dest = 'secrets/use';
      gulp.src("secrets/enc/secrets.yaml", {base:'secrets/enc'})
          .pipe(changed(dest))
          .pipe(decrypt({
              password: secret_key
          }))
          .pipe(gulp.dest(dest))
          // when stream ends, call callback
          .on('end', done);
    }
});

gulp.task('secrets_set', function (done) {
    if (typeof secret_key == 'undefined' || secret_key == '') {
      // skip if no secret_key. Error already issued
      done();
    }else{
      var secrets_all = require('./secrets/use/secrets.yaml');
      if(DBG){
          gutil.log("secrets_all:");
          gutil.log(secrets_all);
      }
      // build the correct secrets for this target
      var secrets;
      if(target != 'normal'){
          secrets = merge.recursive(true, secrets_all['normal'], secrets_all[target]);
      }else{
          secrets = secrets_all['normal'];
      }

      // add the secrets into config
      config['secrets'] = secrets;
      done();
    }
});

// remove all the secrets/src files except example-*
gulp.task('secrets_clean', function (done) {
    if (typeof secret_key == 'undefined' || secret_key == '') {
      // skip if no secret_key. Error already issued
      done();
    }else{
      del(['secrets/src/**','!secrets/src','!secrets/src/example-*'], done);
    }
});



// concrete5 has several root folders that are usually empty but probably needed.
// create these if they don't exist already

gulp.task('c5-make-root-empty-folders', function(){
    var base = 'dist/public_html/';
    var dirs = [
        base+'blocks',
        base+'config',
        base+'controllers',
        base+'css',
        base+'elements',
        base+'files',
        base+'helpers',
        base+'jobs',
        base+'js',
        base+'languages',
        base+'libraries',
        base+'mail',
        base+'models',
        base+'packages',
        base+'page_types',
        base+'single_pages',
        base+'themes',
        base+'tools',
        base+'updates'
    ];

    dirs.forEach(function(dir) {
        // gutil.log("creating " + dir);

        mkdirp(dir, function(err) { 
        // path was created unless there was error
            if (err) console.error(err);
        })

    });
});


// rename all css files in css folder to -src.css
gulp.task('rename-src-css',['concat-main-css', 'base-files'], function(){
    var css_path = 'dist/public_html/packages/theme_' + config.THEME + '/themes/' + config.THEME + '/css';
    var wf_css = [css_path+'/webflow.css', css_path+'/normalize.css'];
    // now just the files to -src.css
    return gulp.src(wf_css)
    .pipe(rename(function (path) {
        path.basename += "-src";
     }))
    .pipe(gulp.dest(css_path))

});

// rename all js files in js folder to -src.js
gulp.task('rename-src-js',['base-files'], function(){
    var js_path = 'dist/public_html/packages/theme_' + config.THEME + '/themes/' + config.THEME + '/js';
    var wf_js = [js_path+'/'+'webflow.js', js_path+'/'+'modernizr.js'];

    //gutil.log("js_path: ", js_path);
    //gutil.log("wf_js: ", wf_js);

    // now just the files to -src.js
    return gulp.src(wf_js)
    //.pipe(debug({title: "rename-src-js"}))
    .pipe(rename(function (path) {
        path.basename += "-src";
     }))
    //.pipe(debug({title: "rename-src-js to:"}))
    .pipe(gulp.dest(js_path))

});


// concatenate main-overrides with main-src.css
gulp.task('concat-main-css',['concat-typography-css'], function() {

  var DEST = 'dist/' + theme_path;
  return gulp.src([DEST + '/main-src.css', theme_path + '/css/main-overrides.css'])
    .pipe(concat('main-src.css'))
    .pipe(gulp.dest(DEST));
});

// concatenate typography-overrides with main-src.css
gulp.task('concat-typography-css',['extract-typography'], function() {

  var DEST = 'dist/' + theme_path;
  return gulp.src([DEST + '/typography-src.css', theme_path + '/css/typography-overrides.css'])
    .pipe(concat('typography-src.css'))
    .pipe(gulp.dest(DEST));
});



// extract typography CSS
// and create main-src.css
gulp.task('extract-typography',['webflow-css','base-files'], function(){
    // extract the typography classes from theme_name.css to create main-src.css and typography-src.css
    //
    var theme_path = 'dist/public_html/packages/theme_' + config.THEME + '/themes/' + config.THEME;
    var app_css = rework(read(webflow_path+'/css/'+config.WEBFLOW_NAME+'.webflow.css', 'utf8'));
    var t_css = extract_typography(app_css.obj.stylesheet);

    write(theme_path+'/typography-src.css', t_css, 'utf8', function(err) {
        if (err) throw err;
    });

    //gutil.log('typography-src.css extracted and saved');

    // now just move and rename the theme.css to main-src.css
    return gulp.src(theme_path+'/css/'+config.WEBFLOW_NAME+'.webflow.css', {base:'./'})
    .pipe(rename(theme_path+'/main-src.css'))

    // fix image paths and remove quotes around the url string for C5
    .pipe(replace(/url\((["']?)\.\.\/images\/(.*?)(["']?)\)/g, 'url(images/$2)'))

    .pipe(gulp.dest('./'))

});

// compress our stylesheets for production into into main.css and typography.css
// also do the webflow css files in css folder
// in dev mode, these are simple copies of main-src and typography-src
gulp.task('compress-css', ['concat-main-css', 'rename-src-css'], function(){
    var theme_path = 'dist/public_html/packages/theme_' + config.THEME + '/themes/' + config.THEME;
    var css_files = [theme_path + '/main-src.css',
    theme_path + '/typography-src.css',
    theme_path + '/css/webflow-src.css',
    theme_path + '/css/normalize-src.css'
    ];
    if(config.COMPRESS_CSS){
        return gulp.src(css_files)
        //.pipe(debug({title: 'compress css:'}))
        .pipe(minifyCSS({keepSpecialComments:false})) // minify
        .pipe(rename(function (path) {
            path.basename = path.basename.substr(0,path.basename.length-4); // strip off -src from end
            }))
        .pipe(gulp.dest(theme_path));
    }else{
        // simply copy and don't compress
        return gulp.src(css_files)
        .pipe(rename(function (path) {
            path.basename = path.basename.substr(0,path.basename.length-4); // strip off -src from end
            }))
        .pipe(gulp.dest(theme_path));
    }
});


// compress js
// in dev mode, simply copy the -src veraion
gulp.task('compress-js', ['rename-src-js'], function(){
    var JS_PATH = 'dist/public_html/packages/theme_' + config.THEME + '/themes/' + config.THEME + '/js';
    var JS_FILES = [JS_PATH + '/webflow-src.js', JS_PATH + '/modernizr-src.js'];
    if(config.COMPRESS_JS){
        return gulp.src(JS_FILES)
        //.pipe(debug({title: 'compress js:'}))
        .pipe(uglify()) // compress
        .pipe(rename(function (path) {
            path.basename = path.basename.substr(0,path.basename.length-4); // strip off -src from end
            }))
        .pipe(gulp.dest(JS_PATH));
    }else{
        // simply copy and don't compress
        return gulp.src(JS_FILES)
        //.pipe(debug({title: "DONT compress-js"}))
        .pipe(rename(function (path) {
            path.basename = path.basename.substr(0,path.basename.length-4); // strip off -src from end
            }))
        .pipe(gulp.dest(JS_PATH));
    }
});



function extract_typography(style) {

    //console.log("style:");
    //console.log(style);

    var typography = {
        rules: []
    }; // empty typography style object

    style.rules.forEach(function(rule) {
        //console.log("rule:");
        //console.log(rule);

        if (rule.type == 'rule') {

            var t_rule = {};
            var t_selectors = [];
            var t_declarations = [];
            var is_empty = true;
            rule.selectors.forEach(function(selector) {
                //console.log("SELECTOR: "+selector);

                if (selector_match(selector)) {
                    //console.log("sel "+selector + " maches.");
                    var declaration_added = false;
                    rule.declarations.forEach(function(declaration) {
                        if (property_match(declaration.property)) {

                            //console.log("dec.prop "+declaration.property + " maches.");

                            // TODO extract this part of the rule into typography
                            t_declarations.push(declaration);
                            declaration_added = true;
                            is_empty = false;
                        }
                    })
                    if (declaration_added) {
                        t_selectors.push(selector);
                    }
                    if (!is_empty) {
                        t_rule = {
                            type: "rule",
                            selectors: t_selectors,
                            declarations: t_declarations
                        };
                        //console.log("adding t_rule:");
                        //console.log(t_rule);
                        typography.rules.push(t_rule); // add this rule to typography
                    }
                }
            })
        } else {
            // ignore all other rule types for now

            //console.log("rule type '" + rule.type + "' ignored:");
            //console.log(rule);
            //typography.rules.push(rule);
        }


    })

    // Return the typography css
    //console.log("typography rules:");
    //console.log(typography.rules);

    var result = css.stringify({
        stylesheet: {
            rules: typography.rules
        }
    });
    //console.log("returning typography css:");
    //console.log(result);
    return result;
}




/*
Split the styles form the theme_webflow.css into main.css and typography.css as follows:

Only move the following properties (and only when they're in the elements listed below this list)
color
font
font-family
font-style
font-variant
font-weight
font-size
line-height
word-spacing
letter-spacing
text-decoration
text-transform
text-align
text-indent
text-shadow

Only move properties listed above when they're in the following elements:
body
a
a:hover
ul
li
ol
p
address
pre
h1
h2
h3
h4
h5
h6
div
blockquote
cite
*/

function selector_match(sel) {
    return sel.match(/^(body|a|a:hover|ul|li|ol|p|address|pre|h1|h2|h3|h4|h5|h6|div|blockquote|cite)$/);
}

function property_match(prop) {
    return prop.match(/^(color|font|font-family|font-style|font-variant|font-weight|font-size|line-height|word-spacing|letter-spacing|text-decoration|text-transform|text-align|text-indent|text-shadow)$/);
}
