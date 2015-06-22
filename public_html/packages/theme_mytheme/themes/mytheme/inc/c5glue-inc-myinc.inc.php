<div class="myinc">
    <?php
    $arg1 = '@@arg1';
    # this is just an example that renders some custom code
    # it is included in place of any block using class c5glue-inc-myinc-var-vvvvv
    # where vvvvv is any alphanumeric string and is passed as $arg1
    # 
    # you can create many "inc" code blocks like this. Just use a different string in place of myinc
    # e.g. class c5glue-inc-specialcode-var-type1 would use block c5glue-inc-specialcode.inc.php and pass in type1 as $arg1
    echo "<p>Test inc block passed arg1: $arg1 </p>\n"; 
    ?>
</div>
