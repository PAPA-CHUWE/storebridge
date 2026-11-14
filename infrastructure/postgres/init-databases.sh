#!/bin/sh
# Runs once, when the Postgres volume is first created.
# Saleor and StoreBridge get separate databases and separate roles, so neither service
# can read or write the other's tables. StoreBridge reaches commerce data only through
# Saleor's API.
set -eu

create_database() {
  name="$1"
  password="$2"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" \
    -v name="$name" -v password="$password" <<'SQL'
CREATE ROLE :"name" LOGIN PASSWORD :'password';
CREATE DATABASE :"name" OWNER :"name";
SQL
}

create_database saleor "$SALEOR_DB_PASSWORD"
create_database storebridge "$STOREBRIDGE_DB_PASSWORD"
