# PostgreSQL Seed Backup

## Purpose

The initial PostgreSQL seed backup captures the software engineering bookstore catalog from `docs/catalog.seed.json` after loading it into a real PostgreSQL database.

This backup lets the project initialize a database from a `pg_dump` artifact instead of re-importing the JSON seed data every time.

## Artifact Location

Current seed backup artifacts are stored in S3, not in this git repository. The concrete bucket, per-dump folder prefix, and object names are configured in an untracked local config file.

Expected local config path:

```text
config/postgres-seed-backup.local.env
```

Create it from the tracked example:

```bash
cp config/postgres-seed-backup.example.env config/postgres-seed-backup.local.env
```

Required variables:

```bash
PSC_SEED_S3_BUCKET=
PSC_SEED_S3_PREFIX=
PSC_SEED_DUMP_OBJECT=
PSC_SEED_SHA256_OBJECT=
```

The backup is a PostgreSQL custom-format dump created with:

```bash
pg_dump --format=custom --no-owner --no-acl
```

It was dumped from PostgreSQL `16.14`.

## Database Contents

The dump contains:

- Schema: `store`
- Table: `store.books`
- Rows: `30`
- Indexes:
  - `books_pkey`
  - `books_isbn_key`
  - `books_category_idx`
  - `books_active_idx`
  - `books_inventory_count_idx`
  - `books_tags_gin_idx`

## Verify The Backup

Download the dump and checksum from the configured per-dump folder into a scratch directory for verification:

```bash
set -a
source config/postgres-seed-backup.local.env
set +a

mkdir -p /tmp/playground-shopping-cart-postgres-seed
aws s3 cp \
  "s3://${PSC_SEED_S3_BUCKET}/${PSC_SEED_S3_PREFIX}/${PSC_SEED_DUMP_OBJECT}" \
  /tmp/playground-shopping-cart-postgres-seed/
aws s3 cp \
  "s3://${PSC_SEED_S3_BUCKET}/${PSC_SEED_S3_PREFIX}/${PSC_SEED_SHA256_OBJECT}" \
  /tmp/playground-shopping-cart-postgres-seed/
```

Verify the checksum:

```bash
(cd /tmp/playground-shopping-cart-postgres-seed && shasum -a 256 -c "${PSC_SEED_SHA256_OBJECT}")
```

Inspect the dump contents:

```bash
pg_restore --list "/tmp/playground-shopping-cart-postgres-seed/${PSC_SEED_DUMP_OBJECT}"
```

## Restore The Backup

Create an empty database, then restore into it:

```bash
createdb playground_shopping_cart
pg_restore \
  --dbname=playground_shopping_cart \
  --no-owner \
  --no-acl \
  "/tmp/playground-shopping-cart-postgres-seed/${PSC_SEED_DUMP_OBJECT}"
```

Verify the restored row count:

```bash
psql playground_shopping_cart \
  -c "SELECT count(*) FROM store.books;"
```

Expected result:

```text
30
```

## S3 Storage Convention

PostgreSQL seed dumps are stored in the configured S3 bucket under the configured project prefix. Each dump lives in its own timestamped folder that contains both the `.dump` file and its `.dump.sha256` checksum file.

Use matching timestamped UTC folder and filenames so each upload is immutable, grouped, and easy to sort:

```text
<project-prefix>/playground_shopping_cart_seed_<UTC-timestamp>/
  playground_shopping_cart_seed_<UTC-timestamp>.dump
  playground_shopping_cart_seed_<UTC-timestamp>.dump.sha256
```

Set `PSC_SEED_S3_PREFIX` to the timestamped folder for the dump being restored. The checksum file should contain only the SHA-256 digest and the dump filename, so verification works after downloading both files into the same scratch directory. Do not store credentials, account identifiers, local user paths, machine names, or other sensitive operational data in these S3 documentation notes.
