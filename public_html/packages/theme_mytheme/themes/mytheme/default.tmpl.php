<?php  
defined('C5_EXECUTE') or die("Access Denied.");
$this->inc('elements/header-default.php'); 

# TODO copy this and modify to create: home, inner, full ... page types and create these in the CMS

# TODO possible hero image selection - work out the page hero image from page attributes
#$page = Page::getCurrentPage();
#$page_handle = $page->getCollectionHandle();
#
#$hero_img_default = $this->getThemePath() . '/img/hero-home.jpg';
#	
#try{
#	$pb = $page->getAttribute('page_hero_image');
#	if($pb){
#		$hero_img = $pb->getVersion()->getRelativePath();
#	}
#	if(!($hero_img)){
#		$hero_img = $hero_img_default;
#	}
#}catch(exception $e){
#	# let it default
#	$hero_img = $hero_img_default;
#} 
?>


@@include('default.inc.php')


<?php   $this->inc('elements/footer-default.php'); ?>