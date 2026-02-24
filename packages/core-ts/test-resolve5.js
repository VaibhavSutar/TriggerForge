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

const view1 = {
    $node: {
        "Generate Blog Draft": [{
            output: {
                text: "test"
            }
        }]
    }
};

const view2 = {
    $node: {
        "Generate Blog Draft": {
            output: {
                text: "test"
            }
        }
    }
};

const view3 = {
    $node: {
        "Generate Blog Draft": undefined
    }
};

console.log("Array View:", resolveExpressions(config.content, view1));
console.log("Object View:", resolveExpressions(config.content, view2));
console.log("Undefined View:", resolveExpressions(config.content, view3));
