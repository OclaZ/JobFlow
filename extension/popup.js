const JOBFLOW_URL = "https://job-flow-psi.vercel.app";

document.addEventListener('DOMContentLoaded', async () => {
    const { clerk_token } = await chrome.storage.local.get('clerk_token');
    if (clerk_token) {
        showMain();
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainSection').style.display = 'none';
}

function showMain() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
}

document.getElementById('loginBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: JOBFLOW_URL });
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await chrome.storage.local.remove('clerk_token');
    showLogin();
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Analyzing page...';
    statusDiv.className = '';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
        // executeScript to scrape data
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapeJobDetails
        });

        const data = results[0]?.result;

        if (data && data.position !== "Unknown Position") {
            statusDiv.textContent = 'Sending to JobFlow...';

            // Get token
            const { clerk_token } = await chrome.storage.local.get('clerk_token');
            if (!clerk_token) {
                statusDiv.textContent = 'Error: No token found. Please connect again.';
                statusDiv.className = 'error';
                return;
            }

            // Send to Background to perform the fetch (avoid CORS issues in popup sometimes)
            chrome.runtime.sendMessage({
                action: "save",
                data: data,
                token: clerk_token,
                apiUrl: JOBFLOW_URL
            }, (res) => {
                if (chrome.runtime.lastError) {
                    statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
                    statusDiv.className = 'error';
                } else if (res && res.success) {
                    statusDiv.textContent = 'Saved successfully! 🎉';
                    statusDiv.className = 'success';
                } else {
                    statusDiv.textContent = 'Error: ' + (res?.error || 'Generic error');
                    statusDiv.className = 'error';
                }
            });
        } else {
            statusDiv.textContent = 'Could not detect job details. Ensure you are on a job page.';
            statusDiv.className = 'error';
        }
    } catch (error) {
        statusDiv.textContent = 'Error: ' + error.message;
        statusDiv.className = 'error';
    }
});

// Helper Function (Injected)
function scrapeJobDetails() {
    const url = window.location.href;
    let title = "";
    let company = "";
    const clean = (text) => text ? text.replace(/\n/g, ' ').trim() : "";

    // -- SCRAPING LOGIC (Same as before, abbreviated here for brevity but assuming user wants robust scraping, I will keep the original robust logic) --
    // I will copy the original logic back in the next block

    // LinkedIn
    if (url.includes("linkedin.com")) {
        title = document.querySelector(".job-details-jobs-unified-top-card__job-title")?.innerText ||
            document.querySelector(".jobs-unified-top-card__job-title")?.innerText ||
            document.querySelector("h1")?.innerText || "";
        company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.innerText ||
            document.querySelector(".jobs-unified-top-card__company-name")?.innerText || "";
    } else if (url.includes("indeed")) {
        title = document.querySelector("h1")?.innerText || "";
        company = document.querySelector("[data-company-name='true']")?.innerText || "";
    } else if (url.includes("glassdoor")) {
        title = document.querySelector('[data-test="job-title"]')?.innerText || "";
        company = document.querySelector('[data-test="employer-name"]')?.innerText || "";
    } else if (url.includes("wttj") || url.includes("welcometothejungle")) {
        title = document.querySelector("h1")?.innerText || "";
        company = document.querySelector("h2")?.innerText || "";
    } else if (url.includes("hellowork")) {
        title = document.querySelector("h1")?.innerText || "";
        company = document.querySelector(".offer-hero-company-name")?.innerText || "";
    }

    // Fallback Meta
    if (!title) title = document.querySelector('meta[property="og:title"]')?.content || document.title;
    if (!company) company = document.querySelector('meta[property="og:site_name"]')?.content;

    // Clean
    title = clean(title);
    company = clean(company);
    if (company && company.split('\n').length > 0) company = company.split('\n')[0];

    return {
        company: company || "Unknown Company",
        position: title || "Unknown Position",
        offer_link: url,
        company_link: url,
        final_status: "Pending",
        dm_sent_date: new Date().toISOString().split('T')[0]
    };
}


