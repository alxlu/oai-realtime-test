const selectQuickfillDropdown = async ({ page, value }) => {
    const options = await page.$$('[role="option"]');
    for (let option of options) {
        const text = await page.evaluate(el => el.textContent, option);
        if (text.trim().toLowerCase() === value.toLowerCase()) {
            await option.click();
            break;
        }
    }
}

const sendInvoice = async ({ page, customerName = 'Zed' }) => {
    const customerNameQFSelector = "[data-cy='quickfill-contact'] input";

    await page.goto('https://qbo.intuit.com/app/invoice');
    await page.waitForSelector(customerNameQFSelector, { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.click(customerNameQFSelector);
    await page.type(customerNameQFSelector, customerName);

    await selectQuickfillDropdown({ page, value: `${customerName}Customer` });

    const comboBoxes = await page.$$('[role="combobox"]');

    for (let comboBox of comboBoxes) {
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), comboBox);

        if (ariaLabel === 'Product or service line 1') {
            await comboBox.click();
            await comboBox.type('Games');
            await selectQuickfillDropdown({ page, value: `Games` });
            break;
        }
    }

    const div = await page.$('#sales-forms-ui\\/email_button');
    const button = await div.$('button');
    await button.click();
};

module.exports = { sendInvoice };
