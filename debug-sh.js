const { google } = require('googleapis');
async function test() {
  const auth = new google.auth.OAuth2();
  // Using an invalid token just to see the error signature
  auth.setCredentials({ access_token: 'dummy' });
  const sheets = google.sheets({ version: 'v4', auth });
  try {
     await sheets.spreadsheets.values.append({
         spreadsheetId: '159jdiXCbWf5TmSgrQavPeTLWSG2k6k9FwfHn4p-Yj1Q', 
         range: 'Leads!A:C',
         valueInputOption: 'USER_ENTERED',
         requestBody: { values: [["hello"]] }
     });
  } catch (e) {
      console.log(e.message);
  }
}
test();
