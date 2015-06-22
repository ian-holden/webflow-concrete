<?php 

defined('C5_EXECUTE') or die(_("Access Denied."));

class ThemeMythemePackage extends Package {
	
	protected $pkgHandle = 'theme_mytheme';
	protected $appVersionRequired = '5.1';
	protected $pkgVersion = '0.1';
	
	public function getPackageDescription() {
		return t("Installs Mytheme theme");
	}
	
	public function getPackageName() {
		return t("Mytheme");
	}
	
	public function install() {  
		$pkg = parent::install();
		// install block
		PageTheme::add('mytheme', $pkg);
		# not needed for just templates BlockType::installBlockTypeFromPackage('autonav', $pkg);

		# special blocks
		#BlockType::installBlockTypeFromPackage('feature_box', $pkg);

		# single-pages
		#$sp = SinglePage::add('/holding', $pkg);
		#$sp->update(array('cName'=>t('holding'), 'cDescription'=>t('holding page')));
		#$p = Page::getByPath('/holding');
		## set attributes
		#$p->setAttribute('exclude_nav', true);
		#$p->setAttribute('exclude_page_list', true);
		#$p->setAttribute('exclude_search_index', true);
		#$p->setAttribute('exclude_sitemapxml', true);


	}

	// Update any existing installation (auto when version is updated and admin upgrades from dashboard)
	public function upgrade() {
		parent::upgrade();
	
		// add another block type
		#$bt = BlockType::getByHandle('feature_box');
		#if (!is_object($bt)) {
		#	BlockType::installBlockTypeFromPackage('feature_box', $this);
		#}
		
		// add another single page
		#$p = Page::getByPath('/path/for/another_page');
		#if ($p->isError() || (!is_object($p))) {
		#	SinglePage::add('/path/for/another_page', $this);
		#}

		# add holding page
		#$p = Page::getByPath('/holding');
		#if ($p->isError() || (!is_object($p))) {
		#	$sp = SinglePage::add('/holding', $this);
		#	$sp->update(array('cName'=>t('holding'), 'cDescription'=>t('holding page')));
		#	$p = Page::getByPath('/holding');
		#}
		## set attributes
		#$p->setAttribute('exclude_nav', true);
		#$p->setAttribute('exclude_page_list', true);
		#$p->setAttribute('exclude_search_index', true);
		#$p->setAttribute('exclude_sitemapxml', true);
		
	}	

}
?>