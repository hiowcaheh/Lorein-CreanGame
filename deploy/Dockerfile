FROM php:8.3-apache

# Gra korzysta z PDO MySQL — w bazowym obrazie tego rozszerzenia nie ma.
RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite

# .htaccess z katalogu gry ma byc respektowany.
RUN sed -ri 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

WORKDIR /var/www/html
