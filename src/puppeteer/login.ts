const accountData = require('../../account.json');

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
    }
};

module.exports = { loginToQBO };
