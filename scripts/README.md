# copy scripts form the examples folder to here for your target distribution

Any script in here will be built and have the tokens substituted with values form your target configuration

These scripts are normally run on a local development machine, and not in a live server environment.

Run the scripts form `dist/scripts` after using `gulp` to build.

For example to build for target "staging" and then sync to the staging server:

```bash
gulp --target=staging
cd dist/scripts
./rsync_local_to_host.sh
```

# example scripts available:

## `rsync_local_to_host.sh` and `rsync_host_to_local.sh`

These use filters in `rsync_local_to_host.txt` and `rsync_host_to_local.txt` respectively.

Default action is Dry Run so no files are actually copied.  
add -c to copy  
add -a to copy all files needed to replicate a site as defined in an alternative filter file `*.all.txt` typically used to download from a host that has content updates (images etc.) you need locally.

uses config:

```
    secrets.ssh.HOST     : {{secrets.ssh.HOST}}
    secrets.ssh.USER     : {{secrets.ssh.USER}}
    secrets.ssh.LOCALDIR : {{secrets.ssh.LOCALDIR}}
    secrets.ssh.HOSTDIR  : {{secrets.ssh.HOSTDIR}}
```

## `save_database.pl` and `save_files.sh`

uses config:

```
    secrets.db.USE_SSH         : {{secrets.db.USE_SSH}}
    secrets.db.HOST            : {{secrets.db.HOST}}
    secrets.db.PORT            : {{secrets.db.PORT}}
    secrets.db.NAME            : {{secrets.db.NAME}}
    secrets.db.USER            : {{secrets.db.USER}}
    secrets.db.PASSWORD        : {{secrets.db.PASSWORD}}
    rsync.EXTRA_FLAGS_INCOMING : {{rsync.EXTRA_FLAGS_INCOMING}}
    rsync.EXTRA_FLAGS_OUTGOING : {{rsync.EXTRA_FLAGS_OUTGOING}}
```

