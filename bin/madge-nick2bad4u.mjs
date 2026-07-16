#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import { madgeConfigPaths } from "../dist/madge-config.js";

const require = createRequire(import.meta.url);
const madgeCliPath = require.resolve("madge/bin/cli.js");

/** @typedef {keyof typeof madgeConfigPaths} MadgePresetName */

/**
 * @param {string} value Candidate preset name.
 *
 * @returns {value is MadgePresetName} Whether the preset is package-owned.
 */
const isMadgePresetName = (value) => Object.hasOwn(madgeConfigPaths, value);

/**
 * @param {string[]} arguments_ Wrapper arguments.
 *
 * @returns {{ forwardedArguments: string[]; preset: MadgePresetName }} Parsed
 *   arguments.
 */
const parseArguments = (arguments_) => {
    let preset = "default";
    const forwardedArguments = [];

    for (let index = 0; index < arguments_.length; index += 1) {
        const argument = arguments_[index];

        if (argument === undefined) {
            continue;
        }

        if (argument === "--preset") {
            const value = arguments_[index + 1];
            if (value === undefined || value.startsWith("-")) {
                throw new TypeError("--preset requires a preset name.");
            }
            preset = value;
            index += 1;
        } else if (argument.startsWith("--preset=")) {
            preset = argument.slice("--preset=".length);
        } else {
            forwardedArguments.push(argument);
        }
    }

    if (!isMadgePresetName(preset)) {
        throw new TypeError(
            `Unknown preset ${JSON.stringify(preset)}. Expected default or runtime.`
        );
    }

    return { forwardedArguments, preset };
};

let parsedArguments;
try {
    parsedArguments = parseArguments(process.argv.slice(2));
} catch (error) {
    const message = String(error);
    process.stderr.write(`madge-nick2bad4u: ${message}\n`);
    process.exitCode = 2;
}

if (parsedArguments) {
    const configPath = madgeConfigPaths[parsedArguments.preset];
    // eslint-disable-next-line n/no-process-env -- wrapper must preserve the consumer environment while selecting the shared Madge config
    const environment = { ...process.env, madge_config: configPath };
    const child = spawn(
        process.execPath,
        [madgeCliPath, ...parsedArguments.forwardedArguments],
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
}
