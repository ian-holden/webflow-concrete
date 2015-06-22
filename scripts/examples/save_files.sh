#!/bin/bash
rsync -avi --stats --progress --delete --exclude="cache" --exclude="updates"  --exclude="tmp" "../public_html/files/" "../../saved_content/files"