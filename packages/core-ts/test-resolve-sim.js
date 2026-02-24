const Mustache = require("mustache");

Mustache.escape = function (text) {
    return text;
};

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
                if (localView.$node) localView.$node = { ...localView.$node };

                for (const [safe, original] of Object.entries(nodeMap)) {
                    if (localView.$node) {
                        localView.$node[safe] = localView.$node[original];
                    }
                }

                const rendered = Mustache.render(preprocessed, localView);
                return rendered;
            } catch (err) {
                console.warn(`[Expression] Failed to resolve "${config}":`, err);
                return config;
            }
        }
        return config;
    }

    if (Array.isArray(config)) {
        return config.map((item) => resolveExpressions(item, view));
    }

    if (config !== null && typeof config === "object") {
        const next = {};
        for (const key in config) {
            next[key] = resolveExpressions(config[key], view);
        }
        return next;
    }

    return config;
}

const config = { "content": "{{ $node[\"Generate Blog Draft\"].output.text }}" };

const view = {
    $node: {
        "Generate Blog Draft": {
            output: {
                text: "<think>\nOkay, I need to write an outline for a blog post... \n\nFinally, I'll wrap it up with a conclusion"
            }
        }
    }
};

console.log("Result:", resolveExpressions(config.content, view));
console.log("Nested Array Config:", resolveExpressions([{ content: config.content }], view));
console.log("Nested Object Config:", resolveExpressions({ "test": config.content }, view));
