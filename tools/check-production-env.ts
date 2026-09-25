import { ZodError } from "zod";

import { validateProductionEnvironment } from "../src/lib/deployment-env";

try {
  validateProductionEnvironment(process.env);
  console.log("Production environment check passed.");
} catch (error) {
  if (error instanceof ZodError) {
    for (const issue of error.issues) {
      console.error(
        `${issue.path.join(".") || "environment"}: ${issue.message}`,
      );
    }
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
}
