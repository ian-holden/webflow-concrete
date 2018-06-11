#!/bin/bash
#
# load the current "target" site (complete) from a local tar.gz archive
#
# files loaded form  ../../saved_content/sites/
# 
# must provide the name as [target]/site.tar.gz
# 
# The current "target" is set by the build and must support ssh connections
# 

if [ -z "$1" ]
  then
    echo "No file argument supplied. Please provide the name as e.g. target/site.tar.gz"
    echo "where target is the appropriate build target name."
    echo "files will be looked for in ../../saved_content/sites/*"
    exit 1
fi

echo "loading site..."
HOST="{{secrets.ssh.HOST}}"
PORT="{{secrets.ssh.PORT}}"
USER="{{secrets.ssh.USER}}"
HOSTDIR="{{secrets.ssh.HOSTDIR}}"

LOCALFILE="../../saved_content/sites/$1"



# 
echo "--------------------------------------------------------------------"
echo "loading site target '{{BUILD_TARGET}}' from archive '$LOCALFILE' ..."
echo "."
echo "WILL RUN: cat \"$LOCALFILE\" | ssh -p $PORT $USER@$HOST \"tar -xzf - -C \\\"$HOSTDIR\\\""
echo "--------------------------------------------------------------------"

read -p "Are you sure? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    
    cat "$LOCALFILE" | ssh -p $PORT $USER@$HOST "tar -xzf - -C \"$HOSTDIR\""
    echo "loaded."

fi
