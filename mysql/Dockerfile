FROM mysql:latest

# RUN chown -R mysql:root /var/lib/mysql/

# ARG MYSQL_ROOT_PASSWORD

ENV MYSQL_ROOT_PASSWORD=AWS@1234

# ADD ./init/init-barware.sql /docker-entrypoint-initdb.d/init-barware.sql
# ADD ./init/init-permissions.sql /docker-entrypoint-initdb.d/init-permissions.sql

EXPOSE 3306