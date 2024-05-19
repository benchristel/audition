import {readdirSync, statSync} from "fs"
import path from "path"

export function listRecursively(dirpath: string): string[] {
  return readdirSync(dirpath).flatMap((entryName) => {
    const pathToEntry = path.join(dirpath, entryName)
    if (isDirectory(pathToEntry)) {
      return listRecursively(pathToEntry)
    } else {
      return [pathToEntry]
    }
  })
}

function isDirectory(path: string): boolean {
  return statSync(path).isDirectory()
}
