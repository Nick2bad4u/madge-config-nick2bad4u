import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
    createMadgeConfig,
    loadMadgeConfig,
    madgeConfig,
    madgeConfigPath,
    parseMadgeConfig,
} from "../src/madge-config.js";

describe("madge shared config", () => {
    it("loads the corrected Graphviz configuration at the top level", async () => {
        expect.assertions(4);

        const rawConfig: unknown = JSON.parse(
            await readFile(madgeConfigPath, "utf8")
        );
        const config = await loadMadgeConfig();

        expect(path.isAbsolute(madgeConfigPath)).toBe(true);
        expect(config).toStrictEqual(rawConfig);
        expect(config.graphVizOptions).toHaveProperty("G.rankdir", "LR");
        expect(config.detectiveOptions).not.toHaveProperty("graphVizOptions");
    });

    it("deep-merges objects, replaces arrays, and leaves the default unchanged", async () => {
        expect.assertions(3);

        const customized = createMadgeConfig({
            detectiveOptions: { ts: { skipTypeImports: true } },
            fileExtensions: ["ts"],
        });

        expect(customized).toHaveProperty(
            "detectiveOptions.ts.skipTypeImports",
            true
        );
        expect(customized.fileExtensions).toStrictEqual(["ts"]);
        expect((await loadMadgeConfig()).fileExtensions).toContain("tsx");
    });

    it("rejects malformed config input", () => {
        expect.assertions(4);

        expect(() => parseMadgeConfig(null)).toThrow(TypeError);
        expect(() => parseMadgeConfig({ baseDir: "." })).toThrow(TypeError);
        expect(() =>
            parseMadgeConfig({ ...madgeConfig, detectiveOptions: [] })
        ).toThrow(TypeError);
        expect(() =>
            parseMadgeConfig({ ...madgeConfig, fileExtensions: [1] })
        ).toThrow(TypeError);
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
});
