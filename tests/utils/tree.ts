import * as path from "@std/path"

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

export const tree = async (dir: string): Promise<Directory> => {
  const tree = await treeInternal({
    type: "dir",
    name: path.basename(dir),
    children: [],
  }, dir)
  return sortTree(tree)
}

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

const sortTree = (tree: Directory) => {
  tree.children.sort((a, b) => a.name.localeCompare(b.name))
  for (const child of tree.children) {
    if (child.type === "dir") {
      sortTree(child)
    }
  }
  return tree
}
