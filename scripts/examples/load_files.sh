#!/bin/bash
rsync -avi --stats --progress --delete --exclude="cache" --exclude="updates"  --exclude="tmp"  "../../saved_content/files/" "../public_html/files"
# clean out the previous cache, and tmp folder content
rm -rf "../public_html/files/cache/*"
rm -rf "../public_html/files/tmp/*"