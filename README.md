# AC CLI

Utility CLI for AtCoder.

## Usage

```sh
./cli/main.ts <command> [options]
```

For example, to create a new contest:

```sh
./cli/main.ts gen abc123
```

## Configuration

Create a `ac.config.ts` file in the root of your project.

```ts
import { defineConfig } from "./cli/main.ts"

export default defineConfig({
  contestsDir: "contests",
})
```
