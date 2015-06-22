<?php $arg1 = '@@arg1';

# this code will replace any webflow class named "c5glue-nav-xxxxx" where xxxxx can be any alphanumeric, and is passed in as $arg1
# class c5glue-nav-main is by convention used to wrap a normal webflow nav block
?>
<div class="nav-<?php echo $arg1;?>">
    <?php
    # this is just an example that renders a custom nav template
    # add your own logic if you like based on the value of $arg1
    $bt_main = BlockType::getByHandle('autonav');
    $bt_main->controller->displayPages = 'top';
    $bt_main->controller->orderBy = 'display_asc';
    $bt_main->controller->displaySubPages = 'all';
    $bt_main->controller->displaySubPageLevels = 'custom';
    $bt_main->controller->displaySubPageLevelsNum = 1;
    $bt_main->render('templates/webflow_navbar');
    ?>
</div>
