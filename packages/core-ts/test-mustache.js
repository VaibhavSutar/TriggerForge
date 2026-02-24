const Mustache = require("mustache");
const config = '{{ $node["Generate Blog Draft"].output.text }}';
const view = { $node: { "Generate Blog Draft": { output: { text: "Hello World" } } } };

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
console.log("Preprocessed:", preprocessed);
const localView = { ...view };
if (localView.$node) localView.$node = { ...localView.$node };
for (const [safe, original] of Object.entries(nodeMap)) {
   if (localView.$node) {
     localView.$node[safe] = localView.$node[original];
   }
}
try {
  const rendered = Mustache.render(preprocessed, localView);
  console.log("Rendered:", rendered);
} catch (e) {
  console.log("Error:", e.message);
}
