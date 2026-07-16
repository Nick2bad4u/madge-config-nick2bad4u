import { defineConfig, type ViteUserConfig } from "vitest/config";

const isCi = [
    "1",
    "on",
    "true",
    "yes",
].includes((process.env["CI"] ?? "").toLowerCase());
const configuredWorkers = Math.trunc(
    Number(process.env["MAX_THREADS"] ?? (isCi ? "1" : "8"))
);
const maxWorkers =
    Number.isSafeInteger(configuredWorkers) && configuredWorkers > 0
        ? configuredWorkers
        : 1;

const vitestConfig: ViteUserConfig = defineConfig({
    cacheDir: "./.cache/vitest",
    test: {
        coverage: {
            clean: true,
            exclude: ["**/*.d.ts"],
            excludeAfterRemap: true,
            include: ["src/**/*.ts"],
            provider: "v8",
            reporter: [
                "text",
                "json",
                "lcov",
                "html",
            ],
            reportOnFailure: true,
            reportsDirectory: "./coverage",
            skipFull: true,
            thresholds: {
                autoUpdate: false,
                branches: 80,
                functions: 80,
                lines: 85,
                statements: 85,
            },
        },
        environment: "node",
        exclude: [
            "**/.cache/**",
            "**/coverage/**",
            "**/dist/**",
            "**/node_modules/**",
            "test/fixtures/**",
        ],
        fileParallelism: !isCi,
        hookTimeout: 15_000,
        include: ["test/**/*.{test,spec}.{ts,tsx,js,mjs,cjs,mts,cts}"],
        isolate: true,
        maxWorkers,
        reporters: ["default"],
        restoreMocks: true,
        retry: 0,
        slowTestThreshold: 300,
        teardownTimeout: 15_000,
        testTimeout: 15_000,
    },
});

export default vitestConfig;
