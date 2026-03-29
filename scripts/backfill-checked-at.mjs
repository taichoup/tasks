import { execFileSync } from "node:child_process";

const [, , tableNameArg, ...restArgs] = process.argv;

if (!tableNameArg) {
  console.error("Usage: node ./scripts/backfill-checked-at.mjs <table-name> [--apply]");
  process.exit(1);
}

const shouldApply = restArgs.includes("--apply");
const region = process.env.AWS_REGION || "eu-north-1";

function awsJson(args) {
  const output = execFileSync("aws", [...args, "--region", region], {
    encoding: "utf8",
  });

  return JSON.parse(output);
}

function readStringAttribute(item, key) {
  return item[key]?.S ?? "";
}

function hasAttribute(item, key) {
  return Object.prototype.hasOwnProperty.call(item, key);
}

function scanAllItems(tableName) {
  const items = [];
  let exclusiveStartKey;

  do {
    const args = ["dynamodb", "scan", "--table-name", tableName, "--output", "json"];
    if (exclusiveStartKey) {
      args.push("--exclusive-start-key", JSON.stringify(exclusiveStartKey));
    }

    const response = awsJson(args);
    items.push(...(response.Items || []));
    exclusiveStartKey = response.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

function buildUpdateArgs(tableName, item) {
  const id = readStringAttribute(item, "id");
  const checkedAt = hasAttribute(item, "checkedAt")
    ? readStringAttribute(item, "checkedAt")
    : readStringAttribute(item, "lastChecked");

  return [
    "dynamodb",
    "update-item",
    "--table-name",
    tableName,
    "--key",
    JSON.stringify({ id: { S: id } }),
    "--update-expression",
    "SET checkedAt = :checkedAt REMOVE checked, lastChecked",
    "--expression-attribute-values",
    JSON.stringify({
      ":checkedAt": { S: checkedAt || "" },
    }),
  ];
}

const items = scanAllItems(tableNameArg);
const itemsToMigrate = items.filter((item) => !hasAttribute(item, "checkedAt"));

console.log(
  JSON.stringify(
    {
      tableName: tableNameArg,
      region,
      totalItems: items.length,
      itemsToMigrate: itemsToMigrate.length,
      mode: shouldApply ? "apply" : "dry-run",
    },
    null,
    2
  )
);

if (!shouldApply) {
  console.log("Dry run only. Re-run with --apply to perform updates.");
  process.exit(0);
}

for (const item of itemsToMigrate) {
  const args = buildUpdateArgs(tableNameArg, item);
  execFileSync("aws", [...args, "--region", region], { stdio: "inherit" });
}

console.log(`Backfill complete for ${tableNameArg}. Migrated ${itemsToMigrate.length} item(s).`);
