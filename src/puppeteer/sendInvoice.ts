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

const getComboBoxByAriaLabel = async ({ page, ariaLabel }) => {
    const comboBoxes = await page.$$('[role="combobox"]');

    for (let comboBox of comboBoxes) {
        const comboBoxAriaLabel = await page.evaluate(el => el.getAttribute('aria-label'), comboBox);
        if (comboBoxAriaLabel === ariaLabel) {
            return comboBox;
        }
    }
};

const sendInvoice = async ({ page, customerName = 'Zed', productOrService = 'Games', amount = '100' }) => {
    const customerNameQFSelector = "[data-cy='quickfill-contact'] input";
    const amountFieldSelector = 'input[data-testid="amount line 1"]';

    await page.goto('https://qbo.intuit.com/app/invoice');

    // Select customer QF
    await page.waitForSelector(customerNameQFSelector, { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.click(customerNameQFSelector);
    await page.type(customerNameQFSelector, customerName);
    await selectQuickfillDropdown({ page, value: `${customerName}Customer` });

    // Select product / service QF
    const productServiceQF = await getComboBoxByAriaLabel({ page, ariaLabel: 'Product or service line 1' });
    await productServiceQF.click();
    await productServiceQF.type(productOrService);
    await selectQuickfillDropdown({ page, value: productOrService });

    // Select the amount
    await page.click(amountFieldSelector);
    await page.type(amountFieldSelector, amount);

    // Send the invoice
    const div = await page.$('#sales-forms-ui\\/email_button');
    const button = await div.$('button');
    await button.click();
};

module.exports = { sendInvoice };
