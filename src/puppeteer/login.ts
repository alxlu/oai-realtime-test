const accountData = require('../../account.json');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const cookieFilePath = path.join(__dirname, '../../cookies.json');

const loadCookiesForAxios = () => {
    const jar = new CookieJar();
  
    if (fs.existsSync(cookieFilePath)) {
      const puppeteerCookies = JSON.parse(fs.readFileSync(cookieFilePath, 'utf-8'));
  
      // Add each cookie to the CookieJar in tough-cookie format
      for (const cookie of puppeteerCookies) {
        const toughCookieStr = `${cookie.name}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path};`;
        if (cookie.expires) {
          // If the cookie has an expiration date, convert it to a valid tough-cookie format
          let expiresDate = new Date(cookie.expires * 1000); // Puppeteer uses UNIX timestamp (seconds)
          if (cookie.expires === -1) {
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            expiresDate = oneWeekFromNow;
          }
  
          jar.setCookieSync(`${toughCookieStr} Expires=${expiresDate.toUTCString()};`, `https://${cookie.domain}`);
        } else {
          jar.setCookieSync(toughCookieStr, `https://${cookie.domain}`);
        }
      }
    }
  
    return jar;
  };


const loginToQBO = async ({ page }) => {
    if (page) {
        const emailInputSelector = '#iux-identifier-first-international-email-user-id-input';
        const emailButtonSelector = 'button[data-testid="IdentifierFirstSubmitButton"]';
        const passwordInputSelector = '#iux-password-confirmation-password';
        const passwordButtonSelector = 'button[data-testid="passwordVerificationContinueButton"]';

        await page.goto('https://app.qbo.intuit.com');

        await page.waitForSelector(emailInputSelector, { timeout: 5000 });
        await page.type(emailInputSelector, accountData.username);
        await page.click(emailButtonSelector);

        await page.waitForSelector(passwordInputSelector, { timeout: 5000 });
        await page.type(passwordInputSelector, accountData.password);
        await page.click(passwordButtonSelector);

        await page.waitForSelector('.account-list', { timeout: 10000 });
        await page.evaluate((companyName) => {
            const companyButtons = Array.from(document.querySelectorAll('.account-btn .account-name'));
            const selectedButton = companyButtons.find(
                (button) => button.innerText === companyName
            );
            if (selectedButton) {
                const parentButton = selectedButton.closest('button');
                if (parentButton) {
                    parentButton.click();
                }
            }
        }, accountData.companyName);
        await page.waitForNavigation();
        const cookies = await page.cookies();
        fs.writeFileSync(cookieFilePath, JSON.stringify(cookies, null, 2));

    }
};

module.exports = { loginToQBO, cookieFilePath, loadCookiesForAxios };
