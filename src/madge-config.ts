import type { ArrayValues, UnknownRecord } from "type-fest";

import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { objectHasIn } from "ts-extras";

/** Parsed Madge configuration bundled by this package. */
export type MadgeConfig = Readonly<UnknownRecord> & {
    readonly baseDir: string;
    readonly detectiveOptions: Readonly<UnknownRecord>;
    readonly fileExtensions: readonly string[];
    readonly graphVizOptions: Readonly<UnknownRecord>;
    readonly tsConfig: string;
};

/** Names of the package-owned Madge presets. */
export const madgePresetNames: readonly ["default", "runtime"] = Object.freeze([
    "default",
    "runtime",
]);

/** A package-owned Madge preset name. */
export type MadgePresetName = ArrayValues<typeof madgePresetNames>;

/** Absolute paths to the package-owned Madge preset files. */
export const madgeConfigPaths: Readonly<Record<MadgePresetName, string>> = {
    default: fileURLToPath(new URL("../.madgerc", import.meta.url)),
    runtime: fileURLToPath(
        new URL("../presets/runtime.madgerc", import.meta.url)
    ),
};

/** Absolute path to the package-owned default `.madgerc`. */
export const madgeConfigPath: string = madgeConfigPaths.default;

/** Absolute path to the package-owned runtime `.madgerc`. */
export const madgeRuntimeConfigPath: string = madgeConfigPaths.runtime;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const assertMadgePresetName = (preset: string): MadgePresetName => {
    switch (preset) {
        case "default":
        case "runtime": {
            return preset;
        }
        default: {
            throw new TypeError(
                `Unknown Madge preset ${JSON.stringify(preset)}. Expected default or runtime.`
            );
        }
    }
};

/** Load and validate a bundled Madge preset. */
export async function loadMadgeConfig(
    preset: MadgePresetName = "default"
): Promise<MadgeConfig> {
    const presetName = assertMadgePresetName(preset);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- package-owned validated path constant
    const contents = await readFile(madgeConfigPaths[presetName], "utf8");
    const parsed: unknown = JSON.parse(contents);

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

const loadBundledMadgeConfig = (preset: MadgePresetName): MadgeConfig => {
    // eslint-disable-next-line n/no-sync, security/detect-non-literal-fs-filename -- synchronous exports are required by Madge's config loader
    const bundledMadgeConfig = readFileSync(madgeConfigPaths[preset], "utf8");

    return parseMadgeConfig(JSON.parse(bundledMadgeConfig));
};

/** Package-owned default Madge configuration. */
export const madgeConfig: MadgeConfig = loadBundledMadgeConfig("default");

/** Package-owned runtime-only Madge configuration. */
export const madgeRuntimeConfig: MadgeConfig =
    loadBundledMadgeConfig("runtime");

/** Package-owned Madge configurations keyed by preset name. */
export const madgePresets: Readonly<Record<MadgePresetName, MadgeConfig>> = {
    default: madgeConfig,
    runtime: madgeRuntimeConfig,
};

const mergeNestedOptionRecords = (
    base: Readonly<UnknownRecord>,
    overrides: Readonly<UnknownRecord>
): UnknownRecord => {
    const merged: UnknownRecord = { ...base };

    for (const key of Reflect.ownKeys(overrides)) {
        if (typeof key !== "string") {
            continue;
        }

        const overrideValue = overrides[key];
        const baseValue = base[key];
        merged[key] =
            isRecord(baseValue) && isRecord(overrideValue)
                ? { ...baseValue, ...overrideValue }
                : overrideValue;
    }

    return merged;
};

/**
 * Create a fresh Madge preset with two-level option merges and replaced arrays.
 */
export function createMadgeConfig(
    overrides: Readonly<UnknownRecord> = {},
    preset: MadgePresetName = "default"
): MadgeConfig {
    const presetName = assertMadgePresetName(preset);
    const clonedBase = structuredClone(madgePresets[presetName]);
    const clonedOverrides = structuredClone(overrides);
    const detectiveOverrides = clonedOverrides["detectiveOptions"];
    const graphVizOverrides = clonedOverrides["graphVizOptions"];

    return parseMadgeConfig({
        ...clonedBase,
        ...clonedOverrides,
        detectiveOptions: objectHasIn(clonedOverrides, "detectiveOptions")
            ? isRecord(detectiveOverrides)
                ? mergeNestedOptionRecords(
                      clonedBase.detectiveOptions,
                      detectiveOverrides
                  )
                : detectiveOverrides
            : clonedBase.detectiveOptions,
        graphVizOptions: objectHasIn(clonedOverrides, "graphVizOptions")
            ? isRecord(graphVizOverrides)
                ? mergeNestedOptionRecords(
                      clonedBase.graphVizOptions,
                      graphVizOverrides
                  )
                : graphVizOverrides
            : clonedBase.graphVizOptions,
    });
}

/** Create a fresh named Madge preset with consumer overrides. */
export function createMadgePreset(
    preset: MadgePresetName,
    overrides: Readonly<UnknownRecord> = {}
): MadgeConfig {
    return createMadgeConfig(overrides, preset);
}

export default madgeConfig;
