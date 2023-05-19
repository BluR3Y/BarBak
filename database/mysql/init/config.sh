#!/bin/bash
mysql -u root -p$MYSQL_ROOT_PASSWORD -h 127.0.0.1 --execute "ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD'";
FLUSH PRIVILEGES;