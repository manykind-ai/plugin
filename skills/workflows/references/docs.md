# Reading the developer docs

The docs at https://developers.manykind.ai are a static site. There is no
`.md` copy of each page, `/llms.txt` has no page index, and `/llms-full.txt`
is one very large file (hundreds of KB). WebFetch returns a paraphrase and
flattens code blocks, so don't use it for exact field names or examples.

## Order of sources

1. **The CLI and the installed SDK.** `mk <command> --help`, `mk schema <name>`
  , `node_modules/@manykind-ai/agent-sdk/dist/**/*.d.ts`. They match
   the version the project uses; the docs describe the latest release.
2. **One docs page, fetched with curl.** The pages are server-rendered, so the
   HTML holds the full text. This strips it to readable text and keeps code
   on separate lines:

   ```sh
   curl -s https://developers.manykind.ai/agents/workflows/steps/ \
     | perl -0pe 's/.*?<div class="sl-markdown-content">//s; s/<footer.*//s;
         s/<div class="ec-line[^>]*>/\n/g; s/<(br|\/p|\/h[1-6]|\/li|\/tr|\/pre)>/\n/g;
         s/<[^>]+>//g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g; s/&#39;/\x27/g; s/&amp;/&/g' \
     | grep -v '^\s*$'
   ```

   To find a page that isn't listed below, read the sitemap:
   `curl -s https://developers.manykind.ai/sitemap-0.xml | grep -oE '<loc>[^<]+'`
   (the index is `/sitemap-index.xml`).
3. **`/llms-full.txt`, last.** Fetch it in byte ranges
   (`curl -s -r 0-60000 …`) and search; never load it whole.

When the docs and `--help` disagree, trust `--help`.

## Key pages

| Topic | URL |
|---|---|
| What a workflow is: graph, carried item, runs, versions | https://developers.manykind.ai/agents/workflows/overview/ |
| Every step kind and its params | https://developers.manykind.ai/agents/workflows/steps/ |
| Triggers: events, schedules, webhooks, connectors | https://developers.manykind.ai/agents/workflows/triggers/ |
| Cubbies | https://developers.manykind.ai/agents/building-blocks/cubbies/ |
| Cubby schema and migrations | https://developers.manykind.ai/agents/building-blocks/cubby-schema/ |
| Workflow best practices | https://developers.manykind.ai/agents/workflows/best-practices/ |
| Memory bank | https://developers.manykind.ai/vaults/memory-bank/ |
| Evaluations | https://developers.manykind.ai/agents/workflows/evaluate/overview/ |
| Release and deploy a workflow | https://developers.manykind.ai/agents/workflows/release/ |
| Push and deploy an agent | https://developers.manykind.ai/agents/ship/push-and-deploy/ |
| CLI reference | https://developers.manykind.ai/reference/cli/ |
| Eval reference | https://developers.manykind.ai/reference/eval/ |

The memory bank page may lag behind the SDK. The rule that holds regardless:
the bank is curated. Workflows don't write it; a curator proposes records and
a person accepts them.
