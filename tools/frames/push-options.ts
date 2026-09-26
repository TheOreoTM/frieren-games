export type FramePushOptions = {
  includePushed: boolean;
};

export function parseFramePushOptions(
  args: readonly string[],
): FramePushOptions {
  const unknown = args.find((argument) => argument !== "--all");
  if (unknown) throw new Error(`Unknown argument: ${unknown}`);

  return { includePushed: args.includes("--all") };
}
