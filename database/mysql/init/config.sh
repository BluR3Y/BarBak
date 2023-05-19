mysql -u root -p$MYSQL_ROOT_PASSWORD --execute "ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD'";
FLUSH PRIVILEGES;