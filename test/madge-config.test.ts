import type { UnknownRecord } from "type-fest";

import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
    createMadgeConfig,
    createMadgePreset,
    loadMadgeConfig,
    madgeConfig,
    madgeConfigPath,
    madgeConfigPaths,
    type MadgePresetName,
    madgeRuntimeConfig,
    madgeRuntimeConfigPath,
    parseMadgeConfig,
} from "../src/madge-config.js";

describe("madge shared config", () => {
    it("loads the corrected Graphviz configuration at the top level", async () => {
        expect.assertions(7);

        const rawConfig: unknown = JSON.parse(
            await readFile(madgeConfigPath, "utf8")
        );
        const config = await loadMadgeConfig();

        expect(path.isAbsolute(madgeConfigPath)).toBe(true);
        expect(config).toStrictEqual(rawConfig);
        expect(config.graphVizOptions).toHaveProperty("G.rankdir", "LR");
        expect(config.graphVizOptions).toHaveProperty("G.concentrate", "true");
        expect(config.graphVizOptions).not.toHaveProperty("C");
        expect(config.graphVizOptions).not.toHaveProperty("S");
        expect(config.detectiveOptions).not.toHaveProperty("graphVizOptions");
    });

    it("deep-merges objects, replaces arrays, and leaves the default unchanged", async () => {
        expect.assertions(7);

        const customized = createMadgeConfig({
            detectiveOptions: { ts: { skipAsyncImports: true } },
            fileExtensions: ["ts"],
            graphVizOptions: { G: { rankdir: "TB" } },
        });

        expect(customized).toHaveProperty(
            "detectiveOptions.ts.skipAsyncImports",
            true
        );
        expect(customized).toHaveProperty(
            "detectiveOptions.ts.skipTypeImports",
            false
        );
        expect(customized).toHaveProperty("graphVizOptions.G.rankdir", "TB");
        expect(customized).toHaveProperty(
            "graphVizOptions.G.bgcolor",
            "#0b0f19"
        );
        expect(customized.fileExtensions).toStrictEqual(["ts"]);
        expect((await loadMadgeConfig()).fileExtensions).toContain("tsx");
        expect(madgeConfig).toHaveProperty("graphVizOptions.G.rankdir", "LR");
    });

    it("exposes a runtime preset that changes only dependency inclusion policy", async () => {
        expect.assertions(11);

        const loadedRuntime = await loadMadgeConfig("runtime");
        const customizedRuntime = createMadgePreset("runtime", {
            graphVizOptions: { G: { rankdir: "TB" } },
        });
        const defaultTypeScriptOptions = madgeConfig.detectiveOptions[
            "ts"
        ] as Readonly<UnknownRecord>;
        const defaultTypeScriptReactOptions = madgeConfig.detectiveOptions[
            "tsx"
        ] as Readonly<UnknownRecord>;
        const expectedRuntime = {
            ...madgeConfig,
            detectiveOptions: {
                ...madgeConfig.detectiveOptions,
                ts: {
                    ...defaultTypeScriptOptions,
                    skipTypeImports: true,
                },
                tsx: {
                    ...defaultTypeScriptReactOptions,
                    skipTypeImports: true,
                },
            },
            includeNpm: false,
        };

        expect(path.isAbsolute(madgeRuntimeConfigPath)).toBe(true);
        expect(madgeRuntimeConfigPath).toBe(madgeConfigPaths.runtime);
        expect(madgeConfigPath).toBe(madgeConfigPaths.default);
        expect(loadedRuntime).toStrictEqual(madgeRuntimeConfig);
        expect(loadedRuntime).toStrictEqual(expectedRuntime);
        expect(loadedRuntime).toHaveProperty("includeNpm", false);
        expect(loadedRuntime).toHaveProperty(
            "detectiveOptions.ts.skipTypeImports",
            true
        );
        expect(madgeConfig).toHaveProperty("includeNpm", true);
        expect(madgeConfig).toHaveProperty(
            "detectiveOptions.ts.skipTypeImports",
            false
        );
        expect(customizedRuntime).toHaveProperty(
            "detectiveOptions.ts.skipTypeImports",
            true
        );
        expect(customizedRuntime).toHaveProperty(
            "graphVizOptions.G.rankdir",
            "TB"
        );
    });

    it("rejects malformed config input", async () => {
        expect.assertions(8);

        expect(() => parseMadgeConfig(null)).toThrow(TypeError);
        expect(() => parseMadgeConfig({ baseDir: "." })).toThrow(TypeError);
        expect(() =>
            parseMadgeConfig({ ...madgeConfig, detectiveOptions: [] })
        ).toThrow(TypeError);
        expect(() =>
            parseMadgeConfig({ ...madgeConfig, fileExtensions: [1] })
        ).toThrow(TypeError);
        expect(() => createMadgeConfig({ detectiveOptions: [] })).toThrow(
            TypeError
        );
        expect(() => createMadgeConfig({ graphVizOptions: "invalid" })).toThrow(
            TypeError
        );
        expect(() => createMadgePreset("invalid" as MadgePresetName)).toThrow(
            "Unknown Madge preset"
        );
        await expect(
            loadMadgeConfig("invalid" as MadgePresetName)
        ).rejects.toThrow("Unknown Madge preset");
    });

    it("runs the bundled CLI wrapper from a consumer working directory", async () => {
        expect.assertions(3);

        const fixtureRoot = await mkdtemp(path.join(tmpdir(), "madge-config-"));
        const sourceRoot = path.join(fixtureRoot, "src");
        await mkdir(sourceRoot);
        await Promise.all([
            writeFile(path.join(sourceRoot, "a.js"), 'import "./b.js";\n'),
            writeFile(path.join(sourceRoot, "b.js"), 'import "./a.js";\n'),
            writeFile(
                path.join(fixtureRoot, "tsconfig.json"),
                '{"compilerOptions":{"allowJs":true}}\n'
            ),
            writeFile(
                path.join(fixtureRoot, "package.json"),
                '{"name":"madge-consumer-fixture","private":true,"type":"module"}\n'
            ),
        ]);

        const wrapperPath = fileURLToPath(
            new URL("../bin/madge-nick2bad4u.mjs", import.meta.url)
        );
        const result = spawnSync(
            process.execPath,
            [
                wrapperPath,
                "--circular",
                "--json",
                "src",
            ],
            { cwd: fixtureRoot, encoding: "utf8" }
        );

        expect(result.status).toBe(1);
        expect(result.stderr).not.toContain("Error:");
        expect(JSON.parse(result.stdout)).toStrictEqual([
            ["src/a.js", "src/b.js"],
        ]);
    });

    it("selects the runtime preset in a real TypeScript dependency graph", async () => {
        expect.assertions(6);

        const fixtureRoot = await mkdtemp(
            path.join(tmpdir(), "madge-runtime-")
        );
        const sourceRoot = path.join(fixtureRoot, "src");
        await mkdir(sourceRoot);
        await Promise.all([
            writeFile(
                path.join(sourceRoot, "consumer.ts"),
                'import type { Contract } from "./contract.js";\nexport const value: Contract = { id: 1 };\n'
            ),
            writeFile(
                path.join(sourceRoot, "contract.ts"),
                "export interface Contract { readonly id: number; }\n"
            ),
            writeFile(
                path.join(fixtureRoot, "tsconfig.json"),
                '{"compilerOptions":{"module":"NodeNext","moduleResolution":"NodeNext"}}\n'
            ),
            writeFile(
                path.join(fixtureRoot, "package.json"),
                '{"name":"madge-runtime-fixture","private":true,"type":"module"}\n'
            ),
        ]);

        const wrapperPath = fileURLToPath(
            new URL("../bin/madge-nick2bad4u.mjs", import.meta.url)
        );
        const defaultResult = spawnSync(
            process.execPath,
            [
                wrapperPath,
                "--json",
                "src",
            ],
            { cwd: fixtureRoot, encoding: "utf8" }
        );
        const runtimeResult = spawnSync(
            process.execPath,
            [
                wrapperPath,
                "--preset",
                "runtime",
                "--json",
                "src",
            ],
            { cwd: fixtureRoot, encoding: "utf8" }
        );
        const defaultGraph: unknown = JSON.parse(defaultResult.stdout);
        const runtimeGraph: unknown = JSON.parse(runtimeResult.stdout);

        expect(defaultResult.status).toBe(0);
        expect(runtimeResult.status).toBe(0);
        expect(defaultResult.stderr).not.toContain("Error:");
        expect(runtimeResult.stderr).not.toContain("Error:");
        expect(defaultGraph).toHaveProperty("src/consumer.ts", [
            "src/contract.ts",
        ]);
        expect(runtimeGraph).toHaveProperty("src/consumer.ts", []);
    });
});
