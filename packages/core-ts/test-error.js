const Mustache = require("mustache");

try {
    const preprocessed = '{{ $node."Generate Blog Draft".output.text }}';
    const out = Mustache.render(preprocessed, {});
    console.log("RENDERED:", out);
} catch (e) {
    console.log("ERROR:", e.message);
}
