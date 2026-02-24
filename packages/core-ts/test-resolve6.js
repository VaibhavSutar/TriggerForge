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
}

const config = `[{{ $node["Generate Blog Draft"].output.text }}]`;
console.log(resolveExpressions(config, {}));
console.log(resolveExpressions(`{{ {{} }}`, {}));
console.log(resolveExpressions(`{{ $node.{{ }}`, {}));
