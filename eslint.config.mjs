import nickTwoBadFourU from "eslint-config-nick2bad4u";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...nickTwoBadFourU.configs.all,

    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: [
                        "*.{js,mjs,cjs}",
                        ".*.{js,mjs,cjs}",
                        "bin/*.mjs",
                    ],
                },
            },
        },
    },
];

export default config;
