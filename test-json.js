const d = "```json\n[\n  {\n    \"name\": \"232 Creative\",\n    \"website\": \"https://232creative.com/\",\n    \"niche\": \"marketing agency\"\n  }\n]\n```";
let rowData = d;
if (typeof rowData === 'string') {
  try {
    const raw = rowData.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    rowData = JSON.parse(raw);
  } catch (e) {
    console.error("Parse failed");
    rowData = [d]; 
  }
}
if (Array.isArray(rowData) && rowData.length > 0 && typeof rowData[0] === 'object' && !Array.isArray(rowData[0])) {
    rowData = rowData.map(item => Object.values(item));
}
if (!Array.isArray(rowData)) rowData = [rowData]; 
if (!Array.isArray(rowData[0])) rowData = [rowData];

console.log(rowData);
