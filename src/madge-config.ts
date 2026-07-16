import type { UnknownRecord } from "type-fest";

import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** Parsed Madge configuration bundled by this package. */
export type MadgeConfig = Readonly<UnknownRecord> & {
    readonly baseDir: string;
    readonly detectiveOptions: Readonly<UnknownRecord>;
    readonly fileExtensions: readonly string[];
    readonly graphVizOptions: Readonly<UnknownRecord>;
    readonly tsConfig: string;
};

/** Absolute path to the package-owned `.madgerc`. */
export const madgeConfigPath: string = fileURLToPath(
    new URL("../.madgerc", import.meta.url)
);

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** Load and validate the bundled `.madgerc`. */
export async function loadMadgeConfig(): Promise<MadgeConfig> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- package-owned path constant
    const parsed: unknown = JSON.parse(await readFile(madgeConfigPath, "utf8"));

    return parseMadgeConfig(parsed);
}

/**
 * Validate unknown input as a Madge config object.
 *
 * @throws When required Madge fields have invalid shapes.
 */
export function parseMadgeConfig(value: unknown): MadgeConfig {
    if (!isRecord(value)) {
        throw new TypeError(
            "Expected the Madge configuration to be an object."
        );
    }

    const {
        baseDir,
        detectiveOptions,
        fileExtensions,
        graphVizOptions,
        tsConfig,
    } = value;

    if (typeof baseDir !== "string" || typeof tsConfig !== "string") {
        throw new TypeError(
            "Madge base directory and TypeScript config must be strings."
        );
    }

    if (!isRecord(detectiveOptions) || !isRecord(graphVizOptions)) {
        throw new TypeError(
            "Madge detectiveOptions and graphVizOptions must be objects."
        );
    }

    if (
        !Array.isArray(fileExtensions) ||
        !fileExtensions.every(
            (extension: unknown): extension is string =>
                typeof extension === "string"
        )
    ) {
        throw new TypeError("Madge fileExtensions must be a string array.");
    }

    return {
        ...value,
        baseDir,
        detectiveOptions,
        fileExtensions,
        graphVizOptions,
        tsConfig,
    };
}

// eslint-disable-next-line n/no-sync, security/detect-non-literal-fs-filename -- a synchronous default export is required by Madge's config loader
const bundledMadgeConfig = readFileSync(madgeConfigPath, "utf8");

/** Package-owned default Madge configuration. */
export const madgeConfig: MadgeConfig = parseMadgeConfig(
    JSON.parse(bundledMadgeConfig)
);

/** Create a fresh Madge config with nested object overrides and replaced arrays. */
export function createMadgeConfig(
    overrides: Readonly<UnknownRecord> = {}
): MadgeConfig {
    const clonedBase = structuredClone(madgeConfig);
    const clonedOverrides = structuredClone(overrides);
    const detectiveOverrides = isRecord(clonedOverrides["detectiveOptions"])
        ? clonedOverrides["detectiveOptions"]
        : {};
    const graphVizOverrides = isRecord(clonedOverrides["graphVizOptions"])
        ? clonedOverrides["graphVizOptions"]
        : {};

    return parseMadgeConfig({
        ...clonedBase,
        ...clonedOverrides,
        detectiveOptions: {
            ...clonedBase.detectiveOptions,
            ...detectiveOverrides,
        },
        graphVizOptions: {
            ...clonedBase.graphVizOptions,
            ...graphVizOverrides,
        },
    });
}

export default madgeConfig;
