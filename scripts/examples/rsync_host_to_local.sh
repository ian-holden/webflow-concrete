#!/bin/bash

usage()
{
cat << EOF
usage: $0 options

This script syncs from host to local
Simple rsync "driver" script.  (Uses SSH as the transport layer.)
http://www.scrounge.org/linux/rsync.html

It only copies new or changed files and ignores
identical files.

OPTIONS:
   -h      Show this message
   -c      Do the copying (otherwise a dry run is performed by default)
   -a      Copy using the filre file name.all.txt instead of name.txt
EOF
}


# Source host machine name
SOURCE="{{secrets.ssh.HOST}}"

# User that rsync will connect as
# Are you sure that you want to run as root, though?
USER="{{secrets.ssh.USER}}"

# Directory to copy from on the source machine.
BACKDIR="{{secrets.ssh.HOSTDIR}}"

# Directory to copy to on the destination machine.
DESTDIR="{{secrets.ssh.LOCALDIR}}"

EXTRA_FLAGS_INCOMING = "{{rsync.EXTRA_FLAGS_INCOMING}}"

# filters file - Contains wildcard patterns of files to include.
# You must create this file.
FILTER_BASE=filters_host_to_local

INFO_MSG="DRY-RUN. Use -c option to do the copy"

ARGOPTS='-n' # dry-run default
FILTEREXT=''
while getopts “hca” OPTION
do
     case $OPTION in
         h)
             usage
             exit 1
             ;;
         c)
             ARGOPTS=''
             INFO_MSG=''
             ;;
         a)
             FILTEREXT='.all'
             ;;
         ?)
             usage
             exit
             ;;
     esac
done

echo $INFO_MSG

#if [[ -z $ARGOPTS ]] || [[ -z $FILTEREXT ]]
#then
#     usage
#     exit 1
#fi

FILTERS=${FILTER_BASE}${FILTEREXT}.txt

# rsync options ref.
# -n Don't do any copying, but display what rsync *would* copy. For testing.
# -i info about files changed
# -a Archive. Mainly propogate file permissions, ownership, timestamp, etc.
# -u Update. Don't copy file if file on destination is newer.
# -v Verbose -vv More verbose. -vvv Even more verbose.
# -K --keep-dirlinks         treat symlinked dir on receiver as dir [avoids destroying root subdomain symlink on Vidahost]
# See man rsync for other options.

OPTS="$ARGOPTS -i -u -a -K --rsh=ssh --stats --progress $EXTRA_FLAGS_INCOMING"

# May be needed if run by cron?
export PATH=$PATH:/bin:/usr/bin:/usr/local/bin

# Only run rsync if $SOURCE responds.
VAR=`ping -s 1 -c 1 $SOURCE > /dev/null; echo $?`
if [ $VAR -eq 0 ]; then
	echo "running rsync $OPTS --filter='. $FILTERS' $USER@$SOURCE:$BACKDIR $DESTDIR"
    rsync $OPTS --filter=". $FILTERS" $USER@$SOURCE:$BACKDIR $DESTDIR
else
    echo "Cannot connect to $SOURCE."
fi

echo "_______________________________"
echo $INFO_MSG
