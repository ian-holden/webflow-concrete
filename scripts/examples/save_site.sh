#!/bin/bash
#
# save the current "target" site (complete) as a tar.gz archive
#
# files saved to ../../saved_content/sites/[target]/site.tar.gz
# 
# The current "target" is set by the build and must support ssh connections
# 
echo "saving site..."
HOST="{{secrets.ssh.HOST}}"
PORT="{{secrets.ssh.PORT}}"
USER="{{secrets.ssh.USER}}"
HOSTDIR="{{secrets.ssh.HOSTDIR}}"
BUILD_TARGET="{{BUILD_TARGET}}"

LOCALDIR="../../saved_content/sites/$BUILD_TARGET"

# make sure the local folder exists
mkdir -p $LOCALDIR

echo "RUNNING: ssh -p $PORT $USER@$HOST \"tar -czf - -C \\\"$HOSTDIR\\\" .\" > \"$LOCALDIR/site.tar.gz\""

ssh -p $PORT $USER@$HOST "tar -czf - -C \"$HOSTDIR\" ." > "$LOCALDIR/site.tar.gz"

echo "saved."
