const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { loadCookiesForAxios } = require('./puppeteer/login.ts');

const makeRequestUsingStoredCookies = async (url) => {
    const jar =  loadCookiesForAxios();
  
    // Wrap axios with the cookie jar support
    const client = wrapper(axios.create({ jar }));
    const headers = {
      'intuit_tid': 'a7f7df1e-4fe4-4054-a423-39be8f2d2b30',
      'Authorization': 'Intuit_APIKey intuit_apikey=prdakyresQEWMsFMPsxn16eHDInpdixsDB8Wd4Ol,intuit_apikey_version=1.0',
      'Content-Type': 'application/json',
      'intuit_originatingip': '127.0.0.1'
    };
  
    try {
      // Make a POST request
      const response = await client.get(url, { headers });
      return response;
    } catch (error) {
      console.error('Error making request with Puppeteer cookies:', error);
    }
  };
  

  const url = 'https://c19.qbo.intuit.com/qbo19/neo/v1/company/9130354581446726/lists/name/list?nameType=customer&includeNameOnly=true&sort=-balance&includeDeleted=false&includeProjects=false&showAttachableCount=true'

  module.exports = { makeRequestUsingStoredCookies, url };