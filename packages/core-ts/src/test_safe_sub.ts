
import Mustache from "mustache";

console.log("Testing Safe Substitution...");

const view = {
    $node: {
        "Create Google Doc": {
            output: { documentId: "DOC_123" }
        }
    }
};

const template = '{{ $node["Create Google Doc"].output.documentId }}';

// 1. Parse keys
const nodeMap: Record<string, string> = {};
let counter = 0;

const preprocessed = template.replace(/\[["']([^"']+)["']\]/g, (match, key) => {
    // Check if we already have a mapping
    if (!Object.values(nodeMap).includes(key)) {
        const safeKey = `__REF_${counter++}`;
        nodeMap[safeKey] = key;
        return `.${safeKey}`;
    }
    // Find existing
    const existingEntry = Object.entries(nodeMap).find(([k, v]) => v === key);
    return existingEntry ? `.${existingEntry[0]}` : match;
});

console.log("Preprocessed:", preprocessed);
console.log("NodeMap:", nodeMap);

// 2. augment view
const safeView = { ...view };
if (safeView.$node) {
    for (const [safe, original] of Object.entries(nodeMap)) {
        // @ts-ignore
        if (safeView.$node[original]) {
            // @ts-ignore
            safeView.$node[safe] = safeView.$node[original];
        }
    }
}

const output = Mustache.render(preprocessed, safeView);
console.log("Output:", output);

if (output === "DOC_123") {
    console.log("SUCCESS");
} else {
    console.log("FAILURE");
}
