const Mustache = require("mustache");
Mustache.escape = function (text) { return text; };

function resolveExpressions(config, view) {
    if (typeof config === "string") {
        if (config.includes("{{")) {
            try {
                const nodeMap = {};
                let counter = 0;

                const preprocessed = config.replace(
                    /\[["']([^"']+)["']\]/g,
                    (match, key) => {
                        if (view.$node && view.$node[key] !== undefined) {
                            const safeKey = `__REF_${counter++}`;
                            nodeMap[safeKey] = key;
                            return `.${safeKey}`;
                        }
                        return "." + key;
                    }
                );

                const localView = { ...view };
                if (localView.$node) localView.$node = { ...localView.$node }; // shallow copy node object

                for (const [safe, original] of Object.entries(nodeMap)) {
                    if (localView.$node) {
                        localView.$node[safe] = localView.$node[original];
                    }
                }

                const rendered = Mustache.render(preprocessed, localView);
                return rendered;
            } catch (err) {
                return config;
            }
        }
    }
    return config;
}

const config = { "content": "{{ $node[\"Generate Blog Draft\"].output.text }}" };

const view = {
    $node: {
        "2": { "output": { "text": "Content By ID" } },
        "Generate Blog Draft": {
            output: {
                text: "Content By Label"
            }
        }
    }
};

console.log("Result:", resolveExpressions(config.content, view));
