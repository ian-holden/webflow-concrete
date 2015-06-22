<?php  
defined('C5_EXECUTE') or die("Access Denied.");
$this->inc('elements/header.php'); 

# THIS VIEW is the default view for simple pages which generate $innerContent
?>

  <div class="x-main-section">
    <div class="w-container x-main-container">
      <div class="w-row">
        <div class="w-col w-col-12">
			<?php  

			print $innerContent;

			?>
        </div>
      </div>
    </div>
  </div>


<?php   $this->inc('elements/footer.php'); ?>