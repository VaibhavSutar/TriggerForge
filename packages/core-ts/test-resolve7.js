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
                if (localView.$node) localView.$node = { ...localView.$node }; // shallow copy node object

                for (const [safe, original] of Object.entries(nodeMap)) {
                    if (localView.$node) {
                        localView.$node[safe] = localView.$node[original];
                    }
                }

                const rendered = Mustache.render(preprocessed, localView);
                return rendered;
            } catch (err) {
                console.warn(`[Expression] Failed to resolve "${config}":`, err);
                return config; // fallback to raw
            }
        }
        return config;
    }
}

const hfOutput = "<think>\nOkay, I need to write an outline for a blog post about 'Cricket World Cup 2026':\n\nFirst, I should start with an introduction to grab the reader's attention. Maybe include a brief history of the tournament to set the context. Then, I need to cover the details of the 2026 event specifically. I should mention the host countries, which I believe are the USA and the West Indies. I should explain why they're hosting and how it's a first for the USA.\n\nNext, the format of the tournament is important. I remember that the 2026 World Cup is going to have a different structure, maybe more teams? I think it's expanding to 14 teams instead of the usual 10. I should outline how the matches will be structured, perhaps a round-robin stage followed by knockouts.\n\nThe venues are another key point. I should list some of the cities and stadiums where the matches will be held, especially highlighting any new or iconic venues. This will help readers visualize where the action will take place.\n\nTeams and their preparation are always a hot topic. I should discuss which teams are expected to perform well, like Australia, India, England, and maybe some underdogs. It would be good to mention any new players or strategies that might make a difference.\n\nPlayer profiles could add some depth. Highlighting key players, both established stars and rising talents, can engage readers who follow individual players. Maybe include some stats or past performances to build excitement.\n\nThe impact on cricket's global growth is significant, especially with the World Cup in the USA. I should talk about how this could increase the sport's popularity there and in other regions. Maybe touch on initiatives to promote cricket in new markets.\n\nTechnology and innovations in the tournament should be covered too. Things like DRS, Powerplay variations, or new broadcast technologies can enhance the fan experience. It might also be good to mention any sustainability efforts by the organizers.\n\nFan engagement is crucial. Discussing how supporters can participate, through tickets, fantasy leagues, or social media, can help build a community around the event. Including some interactive elements might encourage more reader participation.\n\nLooking ahead, I should predict what might happen in the tournament and the legacy it could leave. Speculating on potential winners or surprises can engage readers, and discussing the long-term impact on cricket in the host countries is important.\n\nFinally, I'll wrap it up with a conclusion";

const view = {
    $node: {
        "Generate Blog Draft": {
            output: {
                text: hfOutput
            }
        }
    }
};

const res = resolveExpressions(`[{{ $node["Generate Blog Draft"].output.text }}]`, view);
console.log("RESULT:::", res);
console.log("WAS ERROR:", res === `[{{ $node["Generate Blog Draft"].output.text }}]`);
