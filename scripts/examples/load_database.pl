#!/usr/bin/perl -w
use strict;
use File::Basename;
# load one or two databases from one or two sql dumps in ../../saved_content/databases
# 
# this file is built into the dist folder and tokens are substituted for database credentilas taken form the current configured target
# 
# usage ./load_database.pl filename1.sql [filename2.sql.gz]
# or perl load_database.pl filename1.sql [filename2.sql.gz]
# 
# filename1.sql.gz is the filename of the sql dump in ../../saved_content/databases to be loaded into db1
# filename2.sql.gz is optional and used for a 2nd database if one is configured for your current target

our $debug=0; # set 1 to log more info for debugging

our $sql_file1 = shift || '';
our $sql_file2 = shift || '';

if($sql_file1 eq '') {
	die "ERROR you must provide one or two sql filenames of files in ../../saved_content/databases e.g. live/db_localhost_site_c5_wf_backup.sql\n";
}
if(! -e "../../saved_content/databases/$sql_file1"){
	die "ERROR could not find file '../../saved_content/databases/$sql_file1'\n";
}
if($sql_file2 ne '' && ! -e "../../saved_content/databases/$sql_file2"){
	die "ERROR could not find second file '../../saved_content/databases/$sql_file2'\n";
}

# these vars are updated by the cfg file:
our $execute=1; # 0 to test, 1 to run
my $mysql = '/usr/bin/mysql';
my $mysql_ssh = 'mysql'; # where mysqldump is on ssh host (if used)
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
		r_use_ssh => '{{secrets.db.remote.USE_SSH}}', r_use_ssh_port => '{{secrets.db.remote.USE_SSH_PORT}}',
		r_db_host => '{{secrets.db.remote.HOST}}', r_db_port => '{{secrets.db.remote.PORT}}',

		db_host => '{{secrets.db.HOST}}', db_port => '{{secrets.db.PORT}}',
		db_name => '{{secrets.db.NAME}}', db_user => '{{secrets.db.USER}}', db_pass => '{{secrets.db.PASSWORD}}',
		sql_file => $sql_file1,
	},
	{
		# db2
		r_use_ssh => '{{secrets.db2.remote.USE_SSH}}', r_use_ssh_port => '{{secrets.db2.remote.USE_SSH_PORT}}',
		r_db_host => '{{secrets.db2.remote.HOST}}', r_db_port => '{{secrets.db2.remote.PORT}}',

		db_host => '{{secrets.db2.HOST}}', db_port => '{{secrets.db2.PORT}}',
		db_name => '{{secrets.db2.NAME}}', db_user => '{{secrets.db2.USER}}', db_pass => '{{secrets.db2.PASSWORD}}',
		sql_file => $sql_file2,
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
	my $sql_file = $db->{sql_file};

	if($db_name ne ''){ # ignore unnamed databases, our config allows for up to 2 and one will probably be empty
		my $hostname = $db_host;
		$db_host = '--host=' . $db_host if $db_host ne '';

		# create a cfg file with the password. this is more secure than passing the password in the command which may be exposed to people running a ps command
		my $my_cnf_file = "$dirname/.my.cnf";
		make_temp_my_cnf($my_cnf_file, $db_pass);

		my $cmd = "$mysql --defaults-extra-file=\"$my_cnf_file\" $db_host -u $db_user --port=$db_port $db_name -e \"source ../../saved_content/databases/$sql_file\"";

		if($use_ssh ne ''){

			# first copy the script to the host
			$cmd = "scp -P $use_ssh_port \"../../saved_content/databases/$sql_file\" $use_ssh:temp_db_load_file.sql.gz";
			run($cmd);

			# now copy the .my.cnf file to the host
			$cmd = "scp -P $use_ssh_port \"$my_cnf_file\" $use_ssh:.my.cnf";
			run($cmd);

			# now run the script
			$cmd = "ssh -p $use_ssh_port $use_ssh 'zcat \"temp_db_load_file.sql.gz\" | $mysql_ssh --defaults-extra-file=\".my.cnf\" $db_host -u $db_user --port=$db_port $db_name '";
		}

		my $xcmd = $cmd;
		$xcmd =~ s/p$db_pass/p********/g if $db_pass ne '';
		
		run($cmd, $xcmd);

		if($use_ssh ne ''){
			# now delete the .my.cnf file we copied
			$cmd = "ssh -p $use_ssh_port $use_ssh 'rm .my.cnf'";
			run($cmd);
			
			# now delete the file we copied (optional)
			$cmd = "ssh -p $use_ssh_port $use_ssh 'rm temp_db_load_file.sql.gz'";
			run($cmd);
		}

		unlink $my_cnf_file; # remove the temp cfg file holding our password

	}
}

print get_timestamp() . " <<<<< Finished load.\n\n";

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
