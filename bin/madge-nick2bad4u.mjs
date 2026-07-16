#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const madgeCliPath = require.resolve("madge/bin/cli.js");
const configPath = fileURLToPath(new URL("../.madgerc", import.meta.url));
// eslint-disable-next-line n/no-process-env -- wrapper must preserve the consumer environment while selecting the shared Madge config
const environment = { ...process.env, madge_config: configPath };
const child = spawn(
    process.execPath,
    [madgeCliPath, ...process.argv.slice(2)],
    {
        env: environment,
        stdio: "inherit",
    }
);

child.once("error", (error) => {
    throw error;
});

child.once("exit", (exitCode) => {
    process.exitCode = exitCode ?? 1;
});
