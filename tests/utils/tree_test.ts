import { fs, path } from "../../src/deps.ts"
import { afterAll, assertEquals, beforeAll, describe, it } from "../deps.ts"
import { type Directory, tree } from "./tree.ts"

describe("Tests for tree utility function", () => {
  const testsDir = path.resolve(import.meta.dirname!, "__test__")

  beforeAll(async () => {
    if (await fs.exists(testsDir)) {
      await Deno.remove(testsDir, { recursive: true })
    }
    await Deno.mkdir(testsDir, { recursive: true })

    await Deno.writeTextFile(path.resolve(testsDir, "a.txt"), "a")

    await Deno.mkdir(path.resolve(testsDir, "b"))
    await Deno.writeTextFile(path.resolve(testsDir, "b", "c.txt"), "c")
    await Deno.mkdir(path.resolve(testsDir, "b", "d"))
    await Deno.writeTextFile(path.resolve(testsDir, "b", "d", "e.txt"), "e")
    await Deno.writeTextFile(path.resolve(testsDir, "b", "d", "f.txt"), "f")

    await Deno.mkdir(path.resolve(testsDir, "g"))
    await Deno.writeTextFile(path.resolve(testsDir, "g", "h.txt"), "h")
  })

  afterAll(async () => {
    await Deno.remove(testsDir, { recursive: true })
  })

  it("returns the tree of the directory", async () => {
    const actual = await tree(testsDir)
    const expected: Directory = {
      type: "dir",
      name: "__test__",
      children: [
        {
          type: "dir",
          name: "g",
          children: [{ type: "file", name: "h.txt", content: "h" }],
        },
        {
          type: "dir",
          name: "b",
          children: [
            { type: "file", name: "c.txt", content: "c" },
            {
              type: "dir",
              name: "d",
              children: [
                { type: "file", name: "e.txt", content: "e" },
                { type: "file", name: "f.txt", content: "f" },
              ],
            },
          ],
        },
        { type: "file", name: "a.txt", content: "a" },
      ],
    }
    assertEquals(actual, expected)
  })
})
