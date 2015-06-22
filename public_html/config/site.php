<?php

#
# leave the {{secrets...}} token strings as they will be substituted by the values from your secrets.yaml file at build time
# 

define('DB_SERVER', '{{secrets.db.HOST}}');
define('DB_DATABASE', '{{secrets.db.NAME}}');
define('DB_USERNAME', '{{secrets.db.USER}}');
define('DB_PASSWORD', '{{secrets.db.PASSWORD}}');

# TODO CHANGE THIS SALT TO THE ONE USED BY THE SITE IF NECESSARY:
# NOT USED in 5.6.3.2 define('PASSWORD_SALT', 'BhSDhzsDXnJP6KAXLrmuNJyVo1MKfxTgfzSQHxjXbPQq9cFBnDIkSsPxNR4EnbSt');
define('PASSWORD_HASH_PORTABLE', true); # On 5.6.3 + this will allow the User table to be moved without breaking all user passwords

define('ENABLE_MARKETPLACE_SUPPORT', false); 
define('ENABLE_NEWSFLOW_OVERLAY', false);
