# webflow images are placed here

Copy the images form the webflow export to here.

Note. any referenced to these images in th ewebflow html should be edited to change the path:

change `image/foo.png`
to `<\?php echo $this->getThemePath();?\>/images/foo.png`

remember to also change these in elements/header.php and footer.php 