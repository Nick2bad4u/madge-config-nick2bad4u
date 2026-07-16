import { createConfig } from "remark-config-nick2bad4u";
import remarkValidateLinks from "remark-validate-links";

/**
 * @type {import("remark-config-nick2bad4u").RemarkConfig}
 */
const remarkConfig = createConfig({
    plugins: [
        [
            remarkValidateLinks,
            {
                repository:
                    "https://github.com/Nick2bad4u/madge-config-nick2bad4u",
            },
        ],
        // [myRemarkPlugin, myOptions], // your plugin override here
    ],
    settings: {
        // Overrides here: rule: "*", // your settings override here
    },
});

export default remarkConfig;
