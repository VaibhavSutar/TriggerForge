export async function httpRequest(url: string) {
  const axios = require('axios');
  const res = await axios.get(url);
  return res.data;
}
