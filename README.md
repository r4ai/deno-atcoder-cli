# AtCoder

Utility CLI for AtCoder.

## Installation

```sh
deno install --global --force \
     --allow-net \
     --allow-read \
     --allow-write \
     --allow-env \
     --allow-run \
     --name=atcoder \
     jsr:@r4ai/atcoder-cli
```

## Usage

```sh
atcoder [command] [options]
```

For example, to create a new contest:

```sh
atcoder gen abc123
```

To run tests:

```sh
cd contests/abc123/a
atcoder test
```

## Configuration

Create a `atcoder.config.ts` file in the root of your project.

```ts
// atcoder.config.ts

import { defineConfig } from "jsr:@r4ai/atcoder-cli";

export default defineConfig({
  contestsDir: "contests",
  source: {
    extension: "py",
    compileCommand: (source) =>
      `python3 -m py_compile ${source} && python3.11 ${source} ONLINE_JUDGE 2> /dev/null`,
    executeCommand: (source) => `python3 ${source}`,
  },
});
```

## Development

Install CLI from local source:

```sh
deno install --global --force --allow-net --allow-read --allow-write --allow-env --allow-run --config=deno.jsonc --name=atcoder ./src/main.ts
```
