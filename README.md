# AC CLI

Utility CLI for AtCoder.

## Installation

```sh
deno install --global --allow-net --allow-read --allow-write --name=atcoder jsr:@r4ai/atcoder-cli
```

## Usage

```sh
atcoder [command] [options]
```

For example, to create a new contest:

```sh
atcoder gen abc123
```

## Configuration

Create a `ac.config.ts` file in the root of your project.

```ts
import { defineConfig } from "jsr:@r4ai/atcoder-cli";

export default defineConfig({
  contestsDir: "contests",
  source: {
    extension: "py",
  },
});
```

## Development

Install CLI from local source:

```sh
deno install --global --force --allow-net --allow-read --allow-write --config=deno.jsonc --name=atcoder ./src/main.ts
```
