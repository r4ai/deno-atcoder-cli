import { path } from "../../src/deps.ts"

export type File = {
  type: "file"
  name: string
  content: string
}

export type Directory = {
  type: "dir"
  name: string
  children: Array<File | Directory>
}

export const tree = (dir: string): Promise<Directory> =>
  treeInternal({ type: "dir", name: path.basename(dir), children: [] }, dir)

const treeInternal = async (
  tree: Directory,
  dir: string,
): Promise<Directory> => {
  const entries = Deno.readDir(dir)
  for await (const entry of entries) {
    const entryPath = path.resolve(dir, entry.name)
    if (entry.isFile) {
      const content = await Deno.readTextFile(entryPath)
      tree.children.push({
        type: "file",
        name: entry.name,
        content,
      })
    } else if (entry.isDirectory) {
      const subtree: Directory = {
        type: "dir",
        name: entry.name,
        children: [],
      }
      tree.children.push(subtree)
      await treeInternal(subtree, entryPath)
    }
  }
  return tree
}
