import path from "node:path";

export function isPathInsideRoot(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));

  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

export function requirePathInsideRoot(root: string, candidate: string): string {
  const resolved = path.resolve(candidate);

  if (!isPathInsideRoot(root, resolved)) {
    throw new Error("Refusing to access a path outside CURATOR_MEDIA_ROOT.");
  }

  return resolved;
}
