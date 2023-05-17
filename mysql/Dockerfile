FROM mysql:latest

RUN chown -R mysql:root /var/lib/mysql/

# ADD ./init/init-barware.sql /docker-entrypoint-initdb.d/init-barware.sql
# ADD ./init/init-permissions.sql /docker-entrypoint-initdb.d/init-permissions.sql

EXPOSE 3306

CMD [ "mysqld", "--default-authentication-plugin=mysql_native_password" ]