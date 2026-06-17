const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const projectRoot = "c:\\benf_sys";
const envPath = path.join(projectRoot, ".env.remote.safe");

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

const envContent = fs.readFileSync(envPath, "utf8");

const rawRemoteDbUrl =
  readEnvValue(envContent, "SUPABASE_DUMP_URL") ||
  readEnvValue(envContent, "DATABASE_URL");

const remoteDbUrl = rawRemoteDbUrl
  .replace("?sslmode=require", "")
  .replace("&sslmode=require", "")
  .replace("?sslmode=verify-full", "")
  .replace("&sslmode=verify-full", "");

if (!rawRemoteDbUrl) {
  console.error("No SUPABASE_DUMP_URL or DATABASE_URL found in .env.remote.safe");
  process.exit(1);
}

const tables = [
  "users",
  "roles",
  "permissions",
  "beneficiaries",
  "sponsors",
  "sponsorships",
  "branches",
  "sites",
  "centers",
  "system_modules",
  "role_permissions",
  "user_roles",
  "user_permission_overrides",
  "audit_logs",
  "audit_settings_entities",
  "audit_settings_fields",
];

async function countTable(client, tableName) {
  try {
    const result = await client.query(
      `select count(*)::int as count from public.${tableName}`
    );
    return result.rows[0].count;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

async function runQuery(client, sql) {
  try {
    const result = await client.query(sql);
    return result.rows;
  } catch (error) {
    return [{ error: error.message }];
  }
}

function printRows(title, rows) {
  console.log("\n" + title);
  console.log("-".repeat(title.length));
  console.table(rows);
}

async function main() {
  const remote = new Client({
    connectionString: remoteDbUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const local = new Client({
    connectionString: localDbUrl,
  });

  await remote.connect();
  await local.connect();

  console.log("\nTable comparison: remote Supabase vs local PostgreSQL");
  console.log("----------------------------------------------------");
  console.log("table_name | remote | local | status");
  console.log("----------------------------------------------------");

  for (const table of tables) {
    const remoteCount = await countTable(remote, table);
    const localCount = await countTable(local, table);

    const status = remoteCount === localCount ? "OK" : "DIFFERENT";

    console.log(`${table} | ${remoteCount} | ${localCount} | ${status}`);
  }

  const sampleQueries = [
    {
      title: "Users",
      sql: `
        select username, is_active, is_super_admin
        from public.users
        order by username
        limit 10
      `,
    },
    {
      title: "Roles",
      sql: `
        select role_code, role_name_ar, is_active
        from public.roles
        order by role_code
        limit 20
      `,
    },
    {
      title: "First 20 permissions",
      sql: `
        select permission_code
        from public.permissions
        order by permission_code
        limit 20
      `,
    },
    {
      title: "Beneficiaries sample",
      sql: `
        select id, beneficiary_code, file_number, full_name
from public.beneficiaries
order by created_at desc nulls last
limit 10
      `,
    },
  ];

  for (const item of sampleQueries) {
    const remoteRows = await runQuery(remote, item.sql);
    const localRows = await runQuery(local, item.sql);

    printRows(`REMOTE - ${item.title}`, remoteRows);
    printRows(`LOCAL  - ${item.title}`, localRows);
  }

  await remote.end();
  await local.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});