#!/usr/bin/perl -w
use strict;
use File::Basename;
use File::Path qw(make_path);

# backup one or two databases to ../../saved_content/databases/target. Ideally run this before each commit during development
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
my $save_backups_here = "$dirname/../../saved_content/databases/{{BUILD_TARGET}}";



#mysqldump -h 91.208.99.2 --port=3345 -u z00eu573_ba -p z00eu573_buildingassets > z00_ba_test.sql
#mysqldump --host=91.208.99.2 -u z00eu573_ba -p******** --port=3345 z00eu573_buildingassets > "./../db_exports/db_z00eu573_buildingassets_backup.sql
#
# use_ssh to run the command via ssh and get the output (useful for 1&1 or other hosts we can ssh on to.
# put the hostname & pw etc. into ~/.ssh/config)
# 
my @database_credentials = (
	{
		# db1
		r_use_ssh => '{{secrets.db.remote.USE_SSH}}', r_use_ssh_port => '{{secrets.db.remote.USE_SSH_PORT}}',
		r_db_host => '{{secrets.db.remote.HOST}}', r_db_port => '{{secrets.db.remote.PORT}}',

		db_host => '{{secrets.db.HOST}}', db_port => '{{secrets.db.PORT}}',
		db_name => '{{secrets.db.NAME}}', db_user => '{{secrets.db.USER}}', db_pass => '{{secrets.db.PASSWORD}}',
	},
	{
		# db2
		r_use_ssh => '{{secrets.db2.remote.USE_SSH}}', r_use_ssh_port => '{{secrets.db2.remote.USE_SSH_PORT}}',
		r_db_host => '{{secrets.db2.remote.HOST}}', r_db_port => '{{secrets.db2.remote.PORT}}',

		db_host => '{{secrets.db2.HOST}}', db_port => '{{secrets.db2.PORT}}',
		db_name => '{{secrets.db2.NAME}}', db_user => '{{secrets.db2.USER}}', db_pass => '{{secrets.db2.PASSWORD}}',
	},
);

foreach my $db (@database_credentials){
	my $use_ssh = $db->{r_use_ssh} || '';
	my $use_ssh_port = $db->{r_use_ssh_port} || '22';
	my $db_name = $db->{db_name};
	my $db_host = $db->{r_db_host} || $db->{db_host} || '';
	my $db_port = $db->{r_db_port} || $db->{db_port} || '3306';
	my $db_user = $db->{db_user};
	my $db_pass = $db->{db_pass};

	if($db_name ne ''){ # ignore unnamed databases, our config allows for up to 2 and one will probably be empty
		my $hostname = $db_host;
		$db_host = '--host=' . $db_host if $db_host ne '';
		
		print get_timestamp() . " backing up database $db_name\n";

		my $db_backup = "db_${hostname}_${db_name}_backup.sql.gz";

		make_path($save_backups_here); # create the path needed if necessary
		chmod(0600, "$save_backups_here/$db_backup") if (-e "$save_backups_here/$db_backup"); # allow us to overwrite an existing backup

		# create a cfg file with the password. this is more secure than passing the password in the command which may be exposed to people running a ps command
		my $my_cnf_file = "$dirname/.my.cnf";
		make_temp_my_cnf($my_cnf_file, $db_pass);

		my $cmd = "$mysqldump --defaults-extra-file=\"$my_cnf_file\" $db_host -u $db_user --port=$db_port $db_name | gzip > \"$save_backups_here/$db_backup\"";

		if($use_ssh ne ''){
			
			# copy the .my.cnf file to the host
			$cmd = "scp -P $use_ssh_port \"$my_cnf_file\" $use_ssh:.my.cnf";
			run($cmd);

			$cmd = "ssh -p $use_ssh_port $use_ssh $mysqldump_ssh --defaults-extra-file=\"$my_cnf_file\" $db_host -u $db_user --port=$db_port $db_name | gzip > \"$save_backups_here/$db_backup\"";
		}

		my $xcmd = $cmd;
		$xcmd =~ s/p$db_pass/p********/g if $db_pass ne '';
		
		run($cmd, $xcmd);

		if($use_ssh ne ''){
			# now delete the .my.cnf file we copied
			$cmd = "ssh -p $use_ssh_port $use_ssh 'rm .my.cnf'";
			run($cmd);
		}

		unlink $my_cnf_file; # remove the temp cfg file holding our password

		chmod(0400, "$save_backups_here/$db_backup");
	}
}

print get_timestamp() . " <<<<< Finished backup.\n\n";

# create a cnf file containing just the mysql password
sub make_temp_my_cnf{
	my $file = shift;
	my $pw = shift;
	open CNF, ">$file" or die "Could not open cnf file to write '$file'\n";
	print CNF "[client]\npassword=$pw\n";
	close CNF;
	chmod(0600, $file);
}

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
