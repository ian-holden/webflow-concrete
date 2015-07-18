global parser, tree

from sys import argv
import os, errno
from os.path import isfile, join
from io import StringIO, BytesIO
from lxml import etree
import argparse
import re
import cssutils
import logging

cssutils.log.setLevel(logging.CRITICAL) # so we don't get warnings for e.g. background-size: cover;

def replace_c5_element(c5name):
    global tree
    global theme_path

    # replace all blocks "c5name" with a special marker to include the appropriate c5 code form inc/c5name.inc.php

    tag_str = unicode("<div>@@include('inc/" + c5name + ".inc.php')</div>")
    tag_tree = etree.parse(StringIO(tag_str), parser)
    tag = tag_tree.xpath('//div')
    tag_el = tag.pop()

    navs = tree.xpath("//div[contains(concat(' ', normalize-space(@class), ' '), ' " + c5name + " ')]")
    for nav in navs:
        for el in nav:
            el.getparent().remove(el)
        nav.insert(0,tag_el)

def replace_c5_element_with_arg(c5name, c5inc, arg1):
    global tree
    global theme_path

    # replace all blocks "c5name" with a special marker to include the appropriate c5 code form inc/c5inc.inc.php
    # pass arg1 to the include block in variable arg1

    tag_str = unicode("<div>@@include('inc/" + c5inc + ".inc.php',{\"arg1\": \"" + arg1 + "\"})</div>")
    tag_tree = etree.parse(StringIO(tag_str), parser)
    tag = tag_tree.xpath('//div')
    tag_el = tag.pop()

    navs = tree.xpath("//div[contains(concat(' ', normalize-space(@class), ' '), ' " + c5name + " ')]")
    for nav in navs:
        for el in nav:
            el.getparent().remove(el)
        nav.insert(0,tag_el)


def get_and_remove_block(c5name):
    global tree;

    blocks = tree.xpath("//div[contains(concat(' ', normalize-space(@class), ' '), ' " + c5name + " ')]")
    block_str = ''
    for block in blocks:
        # TODO cope with > 1 blocks here - there sould only ever be one
        for el in block:
            block_str += etree.tostring(el,method='html')
        block.getparent().remove(block)

    return block_str

# handle special php var image names, and change src="images/" to src="<?php echo $this->getThemePath()?>/images/
def correct_links_for_c5(wf_html):
    # first change any special image names to us the php variable
    # c5glue-var-xxxx.jpg => <?php echo ($xxxx ? $xxxx : 'images/c5glue-var-xxxx.jpg');?>
    c5_php = re.sub(
        r'src="images/c5glue-var-(\w+)\.(\w+)',
        r'''src="<?php echo ($\1 ? $\1 : $this->getThemePath() . '/images/c5glue-var-\1.\2');?>''',
        wf_html, flags=re.IGNORECASE)
    # now change the paths to any normal images
    c5_php = re.sub(r'src="images/', 'src="<?php echo $this->getThemePath()?>/images/', c5_php, flags=re.IGNORECASE)
    return c5_php


# find all references in CSS to images named c5glue-var-xxxx and return the script needed to set these from a php variable
# var el= document.getElementById("a").style.background-image;
# el.url = "<?php echo $xxxx;?>";
# jQuery:
# $('selector').css('background-image','url(<?php echo $xxxx;?>)');
def get_c5_glue_var_script_for_css(wf_css):
    global theme_path
    global wf_js
    wf_js = ''
    #cssutils.replaceUrls(sheetOrStyle, replacer, ignoreImportRules=False)
    # TODO implement using cssutils
    sheet = cssutils.parseString(wf_css)
    
    for rule in sheet:
        if rule.type == rule.STYLE_RULE:
            # find property
            #print("rule: %s" % rule)
            for property in rule.style:
                #print("property: %s" % property)
                if(property.name == 'background' or property.name == 'background-image'):
                    m = re.search('c5glue-var-(\w+)\.(\w+)', property.value)
                    if(m != None):
                        php_var_name = m.group(1)
                        img_ext = m.group(2)
                        selector = rule.selectorText
                        wf_js += "$('%s').css('background-image','url(<?php echo $this->controller->get('%s') ? $this->controller->get('%s') : '/%s/images/c5glue-var-%s.%s';?>)');\n" % (selector, php_var_name, php_var_name, theme_path[17:],  php_var_name, img_ext)

    return wf_js


# open a file for writeing and create the folder structure if not already there
# optionally do not empty the file
def open_for_write(filename, truncate=True):
    #print "open for write %s" % filename;
    path = os.path.dirname(filename)
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else: raise
    f = open(filename, 'w')
    if (truncate):
        f.truncate()
    return f

# process the html files
# always create default.php - from default.html if it exists, otherwise from index.html 
# always create home.php - from home.html if it exists, otherwise from index.html
# create *.php from all *.html except index.html and default.html
def process_html_files():
    global webflow_path;
    default_html_file = '';
    home_html_file = '';
    webflow_path_s = webflow_path + '/';
    allfiles = [ f for f in os.listdir(webflow_path_s) if isfile(join(webflow_path_s,f)) ]
    index_exists=False;
    default_exists=False;
    home_exists=False;

    for f in allfiles:
        if(f == 'index.html'):
            index_exists = True;
        elif(f == 'default.html'):
            default_exists = True;
        elif(f == 'home.html'):
            home_exists = True;

    must_create_default = True;
    must_create_home = True;
    if(default_exists):
        process_html_file('default.html', 'default');
        must_create_default = False
    else:
        if(index_exists):
            process_html_file('index.html', 'default');
            must_create_default = False
    
    if(home_exists):
        process_html_file('home.html', 'home');
        must_create_home = False
    else:
        if(index_exists):
            process_html_file('index.html', 'home');
            must_create_home = False

    for f in allfiles:
        if(f[-5:] == '.html'):
            if (f != 'index.html' and f != 'home.html' and f != 'default.html'):
                process_html_file(f, f[0:-5]);
                if (must_create_default):
                    process_html_file(f, 'default');
                    must_create_default = False
                if (must_create_home):
                    process_html_file(f, 'home');
                    must_create_home = False


def process_html_file(filename, name):
    global webflow_path;
    global theme_path;
    global parser;
    global tree;

    print("processing wf html %s to C5 %s ..." % (filename, name));


    tree = etree.parse(webflow_path + '/' + filename, parser);

    # read the html file ready for other processing
    with open (webflow_path + '/' + filename, "r") as hfile:
        html=hfile.read()

    # find all special c5glue classes that need replacing with special include processing
    for m in re.finditer(r"(c5glue-(area|globalarea|nav|inc))-([-\w]+)", html):
        if(m.group(2) == 'inc'):
            # see if a var is needed
            m2 = re.search(r"^([-\w]+)-var-([-\w]+)$", m.group(3))
            if(m2):
                # the form is c5glue-inc-name-var-arg1value
                # replace with a named include block and pass one variable
                replace_c5_element_with_arg(m.group(0), m.group(1) + '-' + m2.group(1), m2.group(2));
            else:
                # the form is c5glue-inc-name
                # simply replace with a named include block
                replace_c5_element(m.group(0))
        else:
            # all except c5glue-inc require one arg o be passed to the block
            replace_c5_element_with_arg(m.group(0), m.group(1), m.group(3));

    # process the header (usually the top of the body section that is common to all pages of this type)
    c5header = get_and_remove_block('c5glue-header')
    hfile = open_for_write(theme_path + '/elements/header-' + name + '.inc.php')
    hfile.write(correct_links_for_c5(c5header))
    hfile.close()

    # process the footer
    c5footer = get_and_remove_block('c5glue-footer')
    ffile = open_for_write(theme_path + '/elements/footer-' + name + '.inc.php')
    ffile.write(correct_links_for_c5(c5footer))
    ffile.close()

    # process the main body
    bfile = open_for_write(theme_path + '/' + name + '.inc.php')
    # print just the body contents
    bodys = tree.xpath("//div[contains(concat(' ', normalize-space(@class), ' '), ' c5glue-main ')]")
    for body in bodys:
        for el in body:
            bfile.write( correct_links_for_c5(etree.tostring(el,method='html')) )
    bfile.close()

    # <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js"></script>
    # <script>
    #   WebFont.load({
    #     google: {
    #       families: ["Roboto:300,regular,500","Roboto Condensed:300,regular"]
    #     }
    #   });
    # </script>

    # process the head. extract just the google fonts code if there is any, and place this in the head inc
    m3 = re.search(r"<script[^\<]+webfont[^\<]+</script>\s*<script>[^\<]+WebFont\.load[^\<]+</script>", html, re.MULTILINE)
    if(m3):
        c5head = m3.group(0);
    else:
        c5head = "<!-- no webflow fonts code needed -->\n"
    
    hfile = open_for_write(theme_path + '/elements/headfonts-' + name + '.inc.php')
    hfile.write(correct_links_for_c5(c5head))
    hfile.close()




aparser = argparse.ArgumentParser()
aparser.add_argument('-t', "--theme_name", default='mytheme',required=False, dest='theme_name')
aparser.add_argument('-w', "--webflow_path",default='webflow',required=False, dest='webflow_path')
aparser.add_argument('-n', "--webflow_name",default='mytheme',required=False, dest='webflow_name')
args = aparser.parse_args()

global theme_path;
theme_path = 'dist/public_html/packages/theme_' + args.theme_name + '/themes/' + args.theme_name
global webflow_path;
webflow_path = args.webflow_path;
global webflow_name;
webflow_name = args.webflow_name;

print("theme path: " + theme_path + ", wf path: " + args.webflow_path)

global parser;
parser = etree.HTMLParser();


process_html_files();

# do wf css analysis for special php variables
with open (args.webflow_path + '/css/' + args.webflow_name + '.webflow.css', "r") as cfile:
    wf_css=cfile.read()

scripts = get_c5_glue_var_script_for_css(wf_css)
print("scripts created:\n%s" % scripts)
sfile = open_for_write(theme_path + '/inc/css_dynamic_images.inc.php')
sfile.write("<script>\n%s\n</script>\n" % scripts)
sfile.close()

