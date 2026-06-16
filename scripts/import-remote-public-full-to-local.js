const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = "c:\\benf_sys";
const envPath = path.join(projectRoot, ".env.remote.safe");
const backupDir = path.join(projectRoot, "backups");
const dumpFile = path.join(backupDir, "supabase_public_full.dump");

const pgDump = "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe";
const pgRestore = "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_restore.exe";
const psql = "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe";

const localAdminUrl =
  "postgresql://postgres:benf_password_123@localhost:5432/postgres";

const localDbUrl =
  "postgresql://benf_user:benf_password_123@localhost:5432/benf_sys_local";

function readEnvValue(content, key) {
  const line = content
    .split(/\r?\n/)
    .find((row) => row.trim().startsWith(`${key}=`));

  if (!line) return "";

  return line
    .substring(line.indexOf("=") + 1)
    .trim()
    .replace(/^"/, "")
    .replace(/"$/, "");
}

function run(label, command, args) {
  console.log(`\n=== ${label} ===`);

  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    console.error(`\nFAILED: ${label}`);
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(envPath)) {
  console.error(".env.remote.safe was not found.");
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const envContent = fs.readFileSync(envPath, "utf8");

const remoteDbUrl =
  readEnvValue(envContent, "SUPABASE_DUMP_URL") ||
  readEnvValue(envContent, "DATABASE_URL");

if (!remoteDbUrl) {
  console.error("No SUPABASE_DUMP_URL or DATABASE_URL found.");
  process.exit(1);
}

if (fs.existsSync(dumpFile)) {
  fs.unlinkSync(dumpFile);
}

run("Testing remote Supabase connection", psql, [
  remoteDbUrl,
  "-c",
  "select current_database(), current_user;",
]);

run("Dumping public schema and data from Supabase", pgDump, [
  "--dbname",
  remoteDbUrl,
  "--schema",
  "public",
  "--format=custom",
  "--no-owner",
  "--no-privileges",
  "--file",
  dumpFile,
]);

const dumpSize = fs.statSync(dumpFile).size;
console.log(`\nDump file size: ${dumpSize} bytes`);

if (dumpSize === 0) {
  console.error("Dump file is 0 bytes. Restore stopped.");
  process.exit(1);
}

run("Dropping local database", psql, [
  localAdminUrl,
  "-c",
  "DROP DATABASE IF EXISTS benf_sys_local WITH (FORCE);",
]);

run("Creating clean local database", psql, [
  localAdminUrl,
  "-c",
  "CREATE DATABASE benf_sys_local OWNER benf_user;",
]);

run("Granting local database privileges", psql, [
  localAdminUrl,
  "-c",
  "GRANT ALL PRIVILEGES ON DATABASE benf_sys_local TO benf_user;",
]);

run("Dropping default public schema", psql, [
  localDbUrl,
  "-c",
  "DROP SCHEMA IF EXISTS public CASCADE;",
]);

run("Restoring public schema and data into local PostgreSQL", pgRestore, [
  "--no-owner",
  "--no-privileges",
  "--dbname",
  localDbUrl,
  dumpFile,
]);

run("Ensuring benf_user owns public schema", psql, [
  localDbUrl,
  "-c",
  "ALTER SCHEMA public OWNER TO benf_user; GRANT ALL ON SCHEMA public TO benf_user;",
]);

console.log("\nPublic schema and data imported into local PostgreSQL successfully.");