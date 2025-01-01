import * as fs from "@std/fs"
import * as path from "@std/path"

export const METADATA_FILE_NAME = "metadata.json" as const

export type Metadata = {
  contest: string
  problem: string
  source: {
    path: string
    compileCommand: string
    executeCommand: string
  }
  tests: { input: string; output: string }[]
}

export const loadMetadata = async (
  metadataPath: string,
): Promise<Metadata | undefined> => {
  if (!fs.existsSync(metadataPath)) {
    return undefined
  }
  const metadata = await Deno.readTextFile(metadataPath)
  return JSON.parse(metadata)
}

export const getMetadata = async (
  dir: string,
): Promise<Metadata | undefined> => {
  const metadataPath = Deno.statSync(path.resolve(dir)).isFile
    ? dir
    : path.resolve(dir, METADATA_FILE_NAME)
  const metadata = await loadMetadata(metadataPath)
  if (metadata) {
    return metadata
  }

  const parentDir = path.dirname(dir)
  if (parentDir === dir) {
    return undefined
  }
  return getMetadata(parentDir)
}

export const getProblemDir = async (
  dir: string,
): Promise<string | undefined> => {
  const isFile = Deno.statSync(path.resolve(dir)).isFile
  const metadataPath = isFile ? dir : path.resolve(dir, METADATA_FILE_NAME)
  const metadata = await loadMetadata(metadataPath)
  if (metadata) {
    return isFile ? path.dirname(dir) : dir
  }

  const parentDir = path.dirname(dir)
  if (parentDir === dir) {
    return undefined
  }
  return getProblemDir(parentDir)
}
