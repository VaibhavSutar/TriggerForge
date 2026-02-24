const txt1 = "<think>\nMy thought process\n</think>\n\nHere is output";
const txt2 = "<think>\nOnly thought process no closing tag";
const txt3 = "Normal output without think tags";
const txt4 = "<think>thought</think>\nFinal text here";

function test(outputText) {
    let stripped = outputText.replace(/<think>[\s\S]*?(?:<\/think>|$)\n*/g, "").trim();
    return stripped || outputText.trim(); 
}

console.log("1:", test(txt1));
console.log("2:", test(txt2));
console.log("3:", test(txt3));
console.log("4:", test(txt4));
