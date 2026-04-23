import { AtpAgent } from "@atproto/api";
import { Command } from "commander";

const COLLECTION = "org.blueres.jobs.jobPost";

const program = new Command();

program
  .name("delete-job-post")
  .description("Delete a single job post record from a PDS by rkey")
  .requiredOption("-h, --handle <handle>", "AT Protocol handle, e.g. you.bsky.social")
  .requiredOption("-p, --password <password>", "App password for the account")
  .requiredOption("-r, --rkey <rkey>", "Record key (rkey) of the job post to delete")
  .option("-s, --service <url>", "PDS service URL", "https://bsky.social")
  .option("--dry-run", "Print what would be deleted without actually deleting")
  .parse(process.argv);

const opts = program.opts<{
  handle: string;
  password: string;
  rkey: string;
  service: string;
  dryRun: boolean;
}>();

async function main() {
  if (opts.dryRun) {
    console.log(`Dry run: would delete ${COLLECTION}/${opts.rkey} from ${opts.handle}`);
    return;
  }

  const agent = new AtpAgent({ service: opts.service });

  console.log(`Logging in as ${opts.handle} on ${opts.service}...`);
  await agent.login({ identifier: opts.handle, password: opts.password });
  console.log(`Logged in. DID: ${agent.session!.did}`);

  await agent.com.atproto.repo.deleteRecord({
    repo: agent.session!.did,
    collection: COLLECTION,
    rkey: opts.rkey,
  });

  console.log(`Deleted ${COLLECTION}/${opts.rkey}`);
}

main().catch((err) => {
  console.error("Error:", err?.message ?? err);
  process.exit(1);
});
