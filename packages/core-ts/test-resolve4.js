const { resolveExpressions } = require('./test-resolve-sim');
const config = { "content": "{{ $node[\"Generate Blog Draft\"].output.text }}" };
const view = { $node: { "Generate Blog Draft": [{ output: { text: "Array Data" } }] } };
console.log(resolveExpressions(config.content, view));
