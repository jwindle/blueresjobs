# BlueRes Jobs

Post and manage job listings on your own [Bluesky](https://bsky.app) PDS using the AT Protocol.

Try it out at [jobs.blueres.org](https://jobs.blueres.org).

## What it does

BlueRes Jobs lets employers own their job posting data the same way they own their Bluesky posts — stored on their Personal Data Server, portable, and under their control.

- **Edit** your employer profile and job listings through a web editor that writes records directly to your PDS via AT Protocol OAuth
- **View** any employer's job listings at `/view/[handle]/jobs`

## Schema

Job data is stored as AT Protocol lexicon records under the `org.blueres.jobs.*` namespace.

**`org.blueres.jobs.employer`** — A singleton employer profile (rkey `self`) describing the organization, including optional job and employee trait definitions used to consistently categorize postings.

**`org.blueres.jobs.jobPost`** — Individual job postings, each keyed by TID. Fields include title, location, employment type, salary range, descriptions (Markdown supported), and structured trait values drawn from the employer's defined trait lists.

## Companion project

[BlueRes](https://github.com/jwindle/blueres) is the résumé counterpart — it uses the same AT Protocol approach to let individuals store their résumé under the `org.blueres.resume.*` namespace on their PDS.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [AT Protocol](https://atproto.com) / [@atproto/oauth-client-node](https://github.com/bluesky-social/atproto)
- [Upstash Redis](https://upstash.com) for OAuth state/session storage
- [Tailwind CSS](https://tailwindcss.com)
