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

## Quick Start

### 1. Configuration

First, create a configuration file in the root of your project:

```ts
// atcoder.config.ts

import { defineConfig } from "jsr:@r4ai/atcoder-cli";

export default defineConfig({
  contestsDir: "contests",
  source: {
    extension: "py",
    compileCommand: (source) => `python3 -m py_compile ${source}`,
    executeCommand: (source) => `python3 ${source}`,
  },
});
```

This is a minimal configuration file for Python.

By default, this CLI is configured for the C++ language.
So, for other languages, you will need to change the config appropriately like the example above.
Specifically, you need to specify the file extension and the compile and execute commands for the language you use.

### 2. Create a Contest

Next, create a new contest:

```sh
atcoder gen abc123
```

This will create a new directory `contests/abc123` with the following structure:

```txt
contests/abc123
├── a/
│  ├── a.py
│  ├── metadata.json
│  └── tests
├── b/
│  ├── b.py
│  ├── metadata.json
│  └── tests
├── c/
│  ├── c.py
│  ├── metadata.json
│  └── tests
├── d/
│  ├── d.py
│  ├── metadata.json
│  └── tests
├── e/
│  ├── e.py
│  ├── metadata.json
│  └── tests
├── f/
│  ├── f.py
│  ├── metadata.json
│  └── tests
├── g/
│  ├── g.py
│  ├── metadata.json
│  └── tests
└── h/
   ├── h.py
   ├── metadata.json
   └── tests
```

### 3. Solve Problems

Solve the problems in each directory.

For example, to solve problem A:

```python
# contests/abc300/a/a.py

N, A, B = map(int, input().split())
C = map(int, input().split())

for i, c in enumerate(C):
    if c == A + B:
        print(i + 1)
```

### 4. Run Tests

Run tests for each problem:

```sh
$ cd contests/abc300/a

$ atcoder test
running 1 test from ./tests/test.ts
abc300/a ...
  tests/in_1.txt ... ok (20ms)
  tests/in_2.txt ... ok (18ms)
  tests/in_3.txt ... ok (19ms)
abc300/a ... ok (97ms)

ok | 1 passed (3 steps) | 0 failed (100ms)
```

This will test the test cases in the tests directory.

```txt
tests/
├── in_1.txt
├── in_2.txt
├── in_3.txt
├── out_1.txt
├── out_2.txt
├── out_3.txt
└── test.ts
```

Note that `atcoder test` is only an alias for `deno test`.
Therefore, `deno test -A` can also run the same test.
Also, since the test file is executable, you can run the test by typing `. /tests/test.ts`.

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
    compileCommand: (source) => `python3 -m py_compile ${source}`,
    executeCommand: (source) => `python3 ${source}`,
  },
});
```

## Example

For sample projects, see the [sample-projects](./tests/sample-projects/).

## Development

Install CLI from local source:

```sh
deno install --global --force --allow-net --allow-read --allow-write --allow-env --allow-run --config=deno.jsonc --name=atcoder ./src/main.ts
```
