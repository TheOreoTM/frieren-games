import { spawn } from "node:child_process";

export type ProcessResult = {
  stdout: string;
  stderr: string;
};

export function runProcess(
  command: string,
  args: string[],
  options: { quiet?: boolean } = {},
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      if (!options.quiet) process.stderr.write(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${command} exited with code ${code ?? "unknown"}.${stderr ? `\n${stderr.trim()}` : ""}`,
        ),
      );
    });
  });
}
