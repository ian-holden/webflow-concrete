#!/usr/bin/perl -w
use strict;
use File::Basename;
# backup one or two databases to ../../saved_content/databases. Ideally run this before each commit during development
# 
# this file is build into the dist folder and tokens are substituted for database credentilas taken form the current configured target
# 
# usage ./dave_database.pl
# or perl save_database.pl

our $debug=0; # set 1 to log more info for debugging


# these vars are updated by the cfg file:
our $execute=1; # 0 to test, 1 to run
my $mysqldump = '/usr/bin/mysqldump';
my $mysqldump_ssh = 'mysqldump'; # where mysqldump is on ssh host (if used)
our $dirname = dirname(__FILE__);
my $save_backups_here = "$dirname/../../saved_content/databases";



#mysqldump -h 91.208.99.2 --port=3345 -u z00eu573_ba -p z00eu573_buildingassets > z00_ba_test.sql
#mysqldump --host=91.208.99.2 -u z00eu573_ba -p******** --port=3345 z00eu573_buildingassets > "./../db_exports/db_z00eu573_buildingassets_backup.sql
#
# use_ssh to run the command via ssh and get the output (useful for 1&1 or other hosts we can ssh on to.
# put the hostname & pw etc. into ~/.ssh/config)
# 
my @database_credentials = (
	{
		# db1
		use_ssh => '{{secrets.db.USE_SSH}}', db_host => '{{secrets.db.HOST}}', db_port => '{{secrets.db.PORT}}',
		db_name => '{{secrets.db.NAME}}', db_user => '{{secrets.db.USER}}', db_pass => '{{secrets.db.PASSWORD}}',
	},
	{
		# db2
		use_ssh => '{{secrets.db2.USE_SSH}}', db_host => '{{secrets.db2.HOST}}', db_port => '{{secrets.db2.PORT}}',
		db_name => '{{secrets.db2.NAME}}', db_user => '{{secrets.db2.USER}}', db_pass => '{{secrets.db2.PASSWORD}}',
	},
);

foreach my $db (@database_credentials){
	my $use_ssh = $db->{use_ssh} || '';
	my $db_name = $db->{db_name};
	my $db_host = $db->{db_host} || '';
	my $db_port = $db->{db_port} || '3306';
	my $db_user = $db->{db_user};
	my $db_pass = $db->{db_pass};

	if($db_name ne ''){ # ignore unnamed databases, our config allows for up to 2 and one will probably be empty
		my $hostname = $db_host;
		$db_host = '--host=' . $db_host if $db_host ne '';
		
		print get_timestamp() . " backing up database $db_name\n";

		my $db_backup = "db_${hostname}_${db_name}_backup.sql";

		chmod(0600, "$save_backups_here/$db_backup") if (-e "$save_backups_here/$db_backup");

		my $cmd = "$mysqldump $db_host -u $db_user -p$db_pass --port=$db_port $db_name > \"$save_backups_here/$db_backup\"";

		if($use_ssh ne ''){
			$cmd = "ssh $use_ssh $mysqldump_ssh $db_host -u $db_user -p$db_pass --port=$db_port $db_name > \"$save_backups_here/$db_backup\""
		}

		my $xcmd = $cmd;
		$xcmd =~ s/p$db_pass/p********/g if $db_pass ne '';
		
		run($cmd, $xcmd);

		chmod(0400, "$save_backups_here/$db_backup");
	}
}

print get_timestamp() . " <<<<< Finished backup.\n\n";

sub run{
	my $cmd=shift;
	my $xcmd=shift || $cmd; # optional modified version of cmd to be logged (perhaps without asswords visible)
	print "executing $xcmd\n";
	if ($execute){
		print `$cmd`;
	}else{
		print "  (cmd not executed in testing mode)\n";
	}
}

sub get_timestamp{
   my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
   return sprintf "%04u%02u%02u_%02u%02u%02u",$year+1900,$mon+1,$mday,$hour,$min,$sec;
}

1;
