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

        // NEW STUFF
        // await page.waitForSelector('div[data-id="unified-qb-dashboard-panel"]', { timeout: 30000 });
        // await sendInvoice({ page });
    }
};

const selectQuickfillDropdown = async ({ page, value }) => {
    const options = await page.$$('[role="option"]'); // Use an attribute selector for role="option"
    for (let option of options) {
        const text = await page.evaluate(el => el.textContent, option);
        console.log('zzz', text.trim());
        if (text.trim().toLowerCase() === value.toLowerCase()) {
            await option.click(); // Clicks the matching option
            break;
        }
    }
}

const sendInvoice = async ({ page, customerName = 'Zed' }) => {
    console.log('zzz enter sendInvoice', page);
    // QUICKFILL-BaseQuickfill-type:contact-subTypes:customer
    const customerNameQFSelector = "[data-cy='quickfill-contact'] input";

    await page.goto('https://qbo.intuit.com/app/invoice');

    console.log('zzz goTo invoice');

    await page.waitForSelector(customerNameQFSelector, { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Waits for 5 seconds
    await page.click(customerNameQFSelector);
    await page.type(customerNameQFSelector, customerName);

    await selectQuickfillDropdown({ page, value: `${customerName}Customer` });

    const comboBoxes = await page.$$('[role="combobox"]');

    for (let comboBox of comboBoxes) {
        // Retrieve the aria-label for the current box
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), comboBox);

        // Check if the aria-label matches the desired string
        if (ariaLabel === 'Product or service line 1') {
            console.log('Found the matching combobox:', ariaLabel);
            // Perform any action you want with this matching box
            await comboBox.click();
            await comboBox.type('Games');
            await selectQuickfillDropdown({ page, value: `Games` });
            break;
        }
    }

    // First, select the div with the ID "hello"
    const div = await page.$('#sales-forms-ui\\/email_button');

    // Then, select the button inside that div and click it
    const button = await div.$('button');
    await button.click();
};

module.exports = { loginToQBO, sendInvoice };
