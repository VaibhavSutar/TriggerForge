const Mustache = require('mustache');

function resolveExpressions(config, view) {
  if (typeof config === 'string') {
    if (config.includes('{{')) {
      try {
        const nodeMap = {};
        let counter = 0;

        const preprocessed = config.replace(
          /\[[\"']([^\"']+)[\"']\]/g,
          (match, key) => {
            if (view.$node && view.$node[key] !== undefined) {
              const safeKey = '__REF_' + (counter++);
              nodeMap[safeKey] = key;
              return '.' + safeKey;
            }
            return '.' + key;
          }
        );
        console.log('Preprocessed:', preprocessed);

        const localView = { ...view };
        if (localView.$node) localView.$node = { ...localView.$node };

        for (const [safe, original] of Object.entries(nodeMap)) {
          if (localView.$node) {
            localView.$node[safe] = localView.$node[original];
          }
        }

        function stringifyObjects(obj) {
          if (obj === null || typeof obj !== 'object') return obj;

          if (Array.isArray(obj)) {
            const clone = [...obj];
            clone.toString = () => JSON.stringify(obj);
            for (let i = 0; i < clone.length; i++) {
              clone[i] = stringifyObjects(clone[i]);
            }
            return clone;
          } else {
            const clone = { ...obj };
            clone.toString = () => JSON.stringify(obj);
            for (const key in clone) {
              if (Object.prototype.hasOwnProperty.call(clone, key)) {
                clone[key] = stringifyObjects(clone[key]);
              }
            }
            return clone;
          }
        }

        const stringifiedView = stringifyObjects(localView);

        const originalEscape = Mustache.escape;
        Mustache.escape = function (text) { return text; };

        const rendered = Mustache.render(preprocessed, stringifiedView);

        Mustache.escape = originalEscape;
        return rendered;
      } catch (err) {
        return config;
      }
    }
    return config;
  }
  return config;
}

const view = {
  $node: {
    'node_1773208752975_1': {
      organic_results: [{ link: 'a' }]
    }
  }
};

const config = "{{ $node['node_1773208752975_1'].organic_results }}";
const config2 = "{{ $node.node_1773208752975_1.organic_results }}";

console.log('Output1:', resolveExpressions(config, view));
console.log('Output2:', resolveExpressions(config2, view));
