<!doctype html>
<html>
<?php 
    /* If this page has the attribute replace_link_with_first_in_nav then redirect to that page instead */
    if ($c->getCollectionAttributeValue('replace_link_with_first_in_nav')) {
            $subPage = $c->getFirstChild();
            if ($subPage instanceof Page) {
                    $nh = Loader::helper('navigation');
                    header ("HTTP/1.1 301 Moved Permanently");
                    header ("Location: " . $nh->getLinkToCollection($subPage));
                    exit();
            }
    }
    /*  If the multilingual add-on is installed then get home page, language and locale from there
    ( see http://www.concrete5.org/marketplace/addons/internationalization/) */
    $lang = LANGUAGE;
    $locale = ACTIVE_LOCALE;
    $home = DIR_REL;
    if( Package::getByHandle('multilingual') ) {
        $ms = MultilingualSection::getCurrentSection();
        if (is_object($ms)) {
            $home = Loader::helper('navigation')->getLinkToCollection($ms, true);
            $lang = $ms->getLanguage();
            $locale = $lang . "_" . $ms->getIcon();
        }
    } 
?>

<head>
  <meta charset="utf-8">

  <!-- Use the .htaccess and remove these lines to avoid edge case issues.
       More info: h5bp.com/b/378 -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

  <!-- fonts
    TODO load any fonts here
    e.g. add the google fonts link, or possibly some @font-face styles
  -->

  <?php

    $loader_vars=array(); # possible variables to pass to the header (e.g. for SEO on Ecwid, the pageTitle and pagDescription)
    $page = Page::getCurrentPage();
    $page_handle = $page->getCollectionHandle();

    Loader::element('header_required'); # load C5 required header code

    ?>

  <!-- Mobile viewport optimized: j.mp/bplateviewport -->
  <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- CSS: normalize and webflow -->
    <link rel="stylesheet" type="text/css" href="<?php echo $this->getThemePath()?>/css/normalize.css">
    <link rel="stylesheet" type="text/css" href="<?php echo $this->getThemePath()?>/css/webflow.css">

    <!-- CSS: the styles from theme_webflow split into main and typography and put into the theme directory -->
    <link rel="stylesheet" type="text/css" href="<?php print $this->getStyleSheet('main.css'); ?>" />
    <!-- don't need typography.css here as those styles are left inside main.css -->

    <!-- pull in Google fonts -->
    @@include('headfonts-default.inc.php')

    <script type="text/javascript" src="<?php echo $this->getThemePath()?>/js/modernizr.js"></script>

    <script>
    if (/mobile/i.test(navigator.userAgent)) document.documentElement.className += ' w-mobile';
    </script>

    <!--[if lt IE 9]><script src="https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7/html5shiv.min.js"></script><![endif]-->

    <!-- end CSS-->

    <!-- Fav and touch icons (in the theme images directory) if needed 16 (or 32) ,60 (default) ,76,120,152 --> 
    <link rel="shortcut icon" href="<?php echo $this->getThemePath()?>/imges/favicon.ico">
    <link rel="apple-touch-icon" href="<?php echo $this->getThemePath()?>/imges/icon-iphone.png">
    <link rel="apple-touch-icon" sizes="76x76" href="<?php echo $this->getThemePath()?>/imges/icon-ipad.png">
    <link rel="apple-touch-icon" sizes="120x120" href="<?php echo $this->getThemePath()?>/imges/icon-iphone-retina.png">
    <link rel="apple-touch-icon" sizes="152x152" href="<?php echo $this->getThemePath()?>/imges/icon-ipad-retina.png">

<style>
.my-navlink:hover {
    color: red;
}
.my-dropdown-toggle:hover {
    color: red;
}
.my-dropdown-link:hover {
    color: red;
}
</style>

</head>
<?php


# TODO possible page specific logic
# 
# This example sets the value of $background_image to the image set in page property "hero_background_image"
# 
$bg_img_default = $this->getThemePath() . '/images/background_default_image.jpg';

    
try{
  $pb = $page->getAttribute('hero_background_image');
  if($pb){
      $background_image = $pb->getVersion()->getRelativePath();
  }
  if(!($background_image)){
      $background_image = $bg_img_default;
  }
}catch(exception $e){
  # let it default
  $background_image = $bg_img_default;
}
$this->controller->set('background_image', $background_image);
?>

<body>
  <!-- Prompt IE 7 users to install Chrome Frame. Remove this if you support IE 7.
       chromium.org/developers/how-tos/chrome-frame-getting-started -->
  <!--[if lt IE 8]><p class=chromeframe>Your browser is <em>ancient!</em> <a href="http://browsehappy.com/">Upgrade to a different browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">install Google Chrome Frame</a> to experience this site.</p><![endif]-->
