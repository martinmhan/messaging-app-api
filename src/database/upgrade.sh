# Use this script to run all the SQL scripts in the /scripts folder in order
# Changes to the database schema should only be done via this script
# SQL scripts should be labeled and numbered in order (with the appropriate leading 0s)
# SQL scripts should be idempotent, i.e., running all of them multiple times in order should not cause any problems.

set -e

source ../../.env;

cd scripts

for FILE in `ls *.sql | sort -V`; do
  mysql -h $DB_HOST -u $DB_USER --password=$DB_PASS $DB_NAME < $FILE;
  echo "Ran $FILE";
done;

echo "Database updated successfully";
exit 0;