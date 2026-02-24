const Mustache = require("mustache");

Mustache.escape = function (text) {
    return text;
};

// ... copy resolveExpressions and run with nodeResults empty vs not empty ...
