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

OPTS=() # array of options (must be an array to handle --filter snd --rsh options correctly)

# Source host machine name
SOURCE="{{secrets.ssh.HOST}}"

# ssh shell option with port if provided

# User that rsync will connect as
# Are you sure that you want to run as root, though?
USER="{{secrets.ssh.USER}}"

# Directory to copy from on the source machine.
BACKDIR="{{secrets.ssh.HOSTDIR}}"

# Directory to copy to on the destination machine.
DESTDIR="{{secrets.ssh.LOCALDIR}}"



PORT="{{secrets.ssh.PORT}}"
if [[ -z "$PORT" ]]; then
    OPTS+=('--rsh=ssh')
else
    OPTS+=("--rsh=ssh -p$PORT")
fi


# filters file - Contains wildcard patterns of files to include.
# You must create this file.
FILTER_BASE=filters_host_to_local

INFO_MSG="DRY-RUN. Use -c option to do the copy"


RSYNCOPTS=("${OPTS[@]}") # OPTS is now available if we want to remove the -n (dry run) added next
RSYNCOPTS+=('-n') # dry-run default
FILTEREXT=''
while getopts “hca” OPTION
do
     case $OPTION in
         h)
             usage
             exit 1
             ;;
         c)
             RSYNCOPTS=("${OPTS[@]}") # remove the -n dry run - revert to $OPTS array
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

FILTERS="${FILTER_BASE}${FILTEREXT}.txt"

# rsync options ref.
# -n Don't do any copying, but display what rsync *would* copy. For testing.
# -i, --itemize-changes       output a change-summary for all updates (repeat this to list all files. -a includes -i [riptgoD])
# -u Update. Don't copy file if file on destination is newer.
# -a Archive. Mainly propogate file permissions, ownership, timestamp, etc.
# [-a means -riptgoD, to ignore permissions, owner, group changes try -ritD ]
# -v Verbose -vv More verbose. -vvv Even more verbose.
# -K --keep-dirlinks         treat symlinked dir on receiver as dir [avoids destroying root subdomain symlink on Vidahost]
# --stats                 give some file-transfer stats
# --progress
# --size-only
# --checksum
# --info=BACKUP,COPY,DEL,NAME,REMOVE,STAT,SYMSAFE [server may not support these flags if < 3.1.0]
# See man rsync for other options.

# checksum only:
#OPTS="$ARGOPTS -u -riD -K --rsh=ssh --stats --checksum"
# time stamp only:
#OPTS="$ARGOPTS -u -ritD -K --rsh=ssh --stats"

RSYNCOPTS+=(-u -riD -K --stats --checksum --delete)

RSYNCOPTS+=({{rsync.EXTRA_FLAGS_INCOMING}})

RSYNCOPTS+=("--filter=. $FILTERS")



# May be needed if run by cron?
export PATH=$PATH:/bin:/usr/bin:/usr/local/bin

# Only run rsync if $SOURCE responds.
VAR=`ping -s 1 -c 1 $SOURCE > /dev/null; echo $?`
if [ $VAR -eq 0 ]; then
    echo "=====RUNNING RSYNC:======"
	echo rsync "${RSYNCOPTS[@]}" "$USER@$SOURCE:$BACKDIR" "$DESTDIR"
    echo "========================="
	rsync "${RSYNCOPTS[@]}" "$USER@$SOURCE:$BACKDIR" "$DESTDIR"
    
else
    echo "Cannot connect to $SOURCE."
fi

echo "_______________________________"
echo $INFO_MSG
