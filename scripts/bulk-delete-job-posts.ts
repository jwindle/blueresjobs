import { AtpAgent } from "@atproto/api";
import { Command } from "commander";

const COLLECTION = "org.blueres.jobs.jobPost";
const BATCH_SIZE = 200;

const program = new Command();

program
  .name("bulk-delete-job-posts")
  .description("Delete job post records from a PDS in bulk")
  .requiredOption("-h, --handle <handle>", "AT Protocol handle, e.g. you.bsky.social")
  .requiredOption("-p, --password <password>", "App password for the account")
  .option("-s, --service <url>", "PDS service URL", "https://bsky.social")
  .option("--inactive", "Delete only records where active is false or absent")
  .option("--all", "Delete all records in the collection")
  .option("--dry-run", "Print what would be deleted without actually deleting")
  .parse(process.argv);

const opts = program.opts<{
  handle: string;
  password: string;
  service: string;
  inactive: boolean;
  all: boolean;
  dryRun: boolean;
}>();

if (!opts.inactive && !opts.all) {
  console.error("Error: specify --inactive or --all");
  process.exit(1);
}

async function listAllRecords(agent: AtpAgent): Promise<Array<{ rkey: string; record: Record<string, unknown> }>> {
  const results: Array<{ rkey: string; record: Record<string, unknown> }> = [];
  let cursor: string | undefined;

  do {
    const { data } = await agent.com.atproto.repo.listRecords({
      repo: agent.session!.did,
      collection: COLLECTION,
      limit: 100,
      cursor,
    });
    for (const r of data.records) {
      results.push({
        rkey: r.uri.split("/").pop()!,
        record: r.value as Record<string, unknown>,
      });
    }
    cursor = data.cursor;
  } while (cursor);

  return results;
}

async function main() {
  const agent = new AtpAgent({ service: opts.service });

  console.log(`Logging in as ${opts.handle} on ${opts.service}...`);
  await agent.login({ identifier: opts.handle, password: opts.password });
  console.log(`Logged in. DID: ${agent.session!.did}`);

  console.log(`\nFetching records from ${COLLECTION}...`);
  const all = await listAllRecords(agent);
  console.log(`Found ${all.length} total record(s).`);

  const toDelete = opts.all
    ? all
    : all.filter((r) => !r.record["active"]);

  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  console.log(`\n-- Records to delete (${toDelete.length}) --`);
  toDelete.forEach((r, i) => {
    const name = (r.record["postName"] as string | undefined) ?? r.rkey;
    const status = r.record["active"] ? "active" : "inactive";
    console.log(`  ${i + 1}. [${status}] ${name}`);
  });

  if (opts.dryRun) {
    console.log(`\nDry run. No changes made.`);
    return;
  }

  const deletes = toDelete.map((r) => ({
    $type: "com.atproto.repo.applyWrites#delete" as const,
    collection: COLLECTION,
    rkey: r.rkey,
  }));

  for (let i = 0; i < deletes.length; i += BATCH_SIZE) {
    const batch = deletes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(deletes.length / BATCH_SIZE);

    console.log(`\nDeleting batch ${batchNum}/${totalBatches} (${batch.length} record(s))...`);
    await agent.com.atproto.repo.applyWrites({
      repo: agent.session!.did,
      writes: batch,
    });
    batch.forEach((_, j) => {
      console.log(`  ✓ ${toDelete[i + j].rkey}`);
    });
  }

  console.log(`\nDone. ${toDelete.length} record(s) deleted.`);
}

main().catch((err) => {
  console.error("Error:", err?.message ?? err);
  process.exit(1);
});
