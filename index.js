const CREDS    = require('./creds'); // SignUp Genius Login Credentials
const selecs   = require('./selectors'); // Puppeteer selectors (scary! Do not look!!)
const puppet   = require('puppeteer'); // Import Puppeteer

const ENDPOINT = process.argv[2]; // Get the link to SignUp Genius page from first argument

const LOGIN_ENDPOINT = 'https://www.signupgenius.com/register'; // Page to log in to SignUp Genius

const CLASS_SLOT = process.argv[3]; // Class slot to sign up to from second argument

async function run() {

    // Init a browser with Pupetteer
    const browser = await puppet.launch({
        headless: false
    });

    if (ENDPOINT == undefined) {
        console.log("Error: No SignUp Genius page was passed in as parameter, check README.");
        process.exit();
    }

    if (CLASS_SLOT == undefined) {
        console.log("Error: No slot number was passed in as parameter, check README.");
        process.exit();
    }

    // Log into account
    await logIn(browser);
    
    // Attempt to sign up for class slot
    await signUpForClass(browser, CLASS_SLOT);

    // Employees must wash hands
    browser.close();
}

async function logIn(browser) {

    // Check if someone (anyone) put their SignUp credentials
    if (CREDS.email == "" || CREDS.password == "") {
        console.log("Error: Uh oh... Someone forgot to put their credentials in 'creds.js'!");
        process.exit();
    }
    
    // New page
    const page = await browser.newPage();

    // Go login page
    await page.goto(LOGIN_ENDPOINT);
    
    // Click email field & fill it in
    await page.click(selecs.EMAIL);
    await page.keyboard.type(CREDS.email);

    // Click password field & fill it in
    await page.click(selecs.PASSW);
    await page.keyboard.type(CREDS.password);

    // Click login button & let the fun begin!!
    await page.click(selecs.LOGIN);

    page.close();
}

async function signUpForClass(browser, slot) {

    // Aight new page, let's go bois!
    const page = await browser.newPage();

    // Go to SignUp Genius page from arguments
    await page.goto(ENDPOINT);

    // Get status of slot
    let status = await checkClassStatus(page, slot);

    // Terminate if class full... Sorry buddy
    if (status == "full") return false;

    // Replace selector with actual slot number
    const CHECK_SELECTOR = selecs.CHECK.replace("_SLOT_", slot);

    // Click on checkbox
    await page.click(CHECK_SELECTOR);

    // Click submit!!
    await page.click(selecs.SUBMT);

    // Wait one second...
    await page.waitFor(5*1000);

    // Click that sign up button!
    await page.click(selecs.SIGNI);

    console.log("Aight bby your signed up for class slot #" + slot + ". Please have a good day :-)");

    return true;
}

async function checkClassStatus(page, slot) {

    // Replace selector slot with actual slot number
    const TABLE_SELECTOR = selecs.TABLE.replace("_SLOT_", slot);

    // Evaluate status of slot text (Sometimes there isnt one?)
    let class_status = await page.evaluate((sel) => {
        let element = document.querySelector(sel);
        return element? element.innerHTML: null;
    }, TABLE_SELECTOR);

    // Respond accordingly
    if (class_status == "Already filled") {
        console.log("Class slot #" + slot + " is full, lets try something else...");
        return "full";
    } else if (class_status == null) { // Sometimes when the class is open it doesnt even display the amount of slots, so yeah...
        console.log("Class slot #" + slot + " is open? I guess...");
        return "whoknows";
    } else {
        console.log("Class slot #" + slot + " has " + class_status);
        return "open";
    }
};

run();
