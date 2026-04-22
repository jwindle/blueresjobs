import { AtpAgent } from "@atproto/api";
import { Command } from "commander";
import fs from "fs";
import path from "path";

const COLLECTION = "org.blueres.jobs.jobPost";
const BATCH_SIZE = 200;

const program = new Command();

program
  .name("bulk-upload")
  .description("Upload job post JSON files from a directory to a PDS")
  .requiredOption("-h, --handle <handle>", "AT Protocol handle, e.g. you.bsky.social")
  .requiredOption("-p, --password <password>", "App password for the account")
  .option("-s, --service <url>", "PDS service URL", "https://bsky.social")
  .option("-d, --dir <path>", "Directory of JSON files to upload", "./example-data")
  .option("--dry-run", "Print what would be uploaded without actually uploading")
  .parse(process.argv);

const opts = program.opts<{
  handle: string;
  password: string;
  service: string;
  dir: string;
  dryRun: boolean;
}>();

async function main() {
  const dir = path.resolve(opts.dir);

  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.error(`No JSON files found in ${dir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} file(s) in ${dir}`);

  const writes = files.map((file) => {
    const filePath = path.join(dir, file);
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      $type: "com.atproto.repo.applyWrites#create" as const,
      collection: COLLECTION,
      value,
    };
  });

  if (opts.dryRun) {
    console.log("\n-- Dry run: records that would be uploaded --");
    writes.forEach((w, i) => {
      const record = w.value as Record<string, unknown>;
      console.log(`  ${i + 1}. ${record["postName"] ?? files[i]}`);
    });
    console.log(`\nTotal: ${writes.length} record(s). No changes made.`);
    return;
  }

  const agent = new AtpAgent({ service: opts.service });

  console.log(`\nLogging in as ${opts.handle} on ${opts.service}...`);
  await agent.login({ identifier: opts.handle, password: opts.password });
  console.log(`Logged in. DID: ${agent.session!.did}`);

  // Upload in batches of BATCH_SIZE
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(writes.length / BATCH_SIZE);

    console.log(`\nUploading batch ${batchNum}/${totalBatches} (${batch.length} record(s))...`);

    const result = await agent.com.atproto.repo.applyWrites({
      repo: agent.session!.did,
      writes: batch,
    });

    const results = (result.data as { results?: Array<{ uri?: string }> }).results ?? [];
    results.forEach((r, j) => {
      console.log(`  ✓ ${files[i + j]} → ${r.uri ?? "(no URI returned)"}`);
    });
  }

  console.log(`\nDone. ${writes.length} record(s) uploaded to collection ${COLLECTION}.`);
}

main().catch((err) => {
  console.error("Error:", err?.message ?? err);
  process.exit(1);
});
