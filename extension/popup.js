document.addEventListener('DOMContentLoaded', async () => {
    const token = await chrome.storage.local.get('token');
    if (token.token) {
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

document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const statusDiv = document.getElementById('status');

    statusDiv.textContent = 'Logging in...';
    statusDiv.className = '';

    try {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch('http://localhost:8000/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            await chrome.storage.local.set({ token: data.access_token });
            statusDiv.textContent = '';
            showMain();
        } else {
            statusDiv.textContent = 'Login failed. Check credentials.';
            statusDiv.className = 'error';
        }
    } catch (error) {
        statusDiv.textContent = 'Error: ' + error.message;
        statusDiv.className = 'error';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await chrome.storage.local.remove('token');
    showLogin();
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Scraping...';
    statusDiv.className = '';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
        // Use programmatic script injection instead of message passing
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapeJobDetails
        });

        const data = results[0]?.result;

        if (data && data.position !== "Unknown Position") {
            statusDiv.textContent = 'Saving to JobFlow...';

            // Get token
            const { token } = await chrome.storage.local.get('token');

            chrome.runtime.sendMessage({ action: "save", data: data, token: token }, (res) => {
                if (res && res.success) {
                    statusDiv.textContent = 'Saved successfully! 🎉';
                    statusDiv.className = 'success';
                } else {
                    statusDiv.textContent = 'Error saving: ' + (res?.error || 'Unknown error');
                    statusDiv.className = 'error';
                }
            });
        } else {
            statusDiv.textContent = 'Could not find job details. Make sure you are on a job post page.';
            statusDiv.className = 'error';
        }
    } catch (error) {
        statusDiv.textContent = 'Error: ' + error.message;
        statusDiv.className = 'error';
    }
});

// This function will be injected into the page
function scrapeJobDetails() {
    const url = window.location.href;
    let title = "";
    let company = "";

    if (url.includes("linkedin.com")) {
        // LinkedIn - try multiple selectors
        title = document.querySelector(".job-details-jobs-unified-top-card__job-title")?.innerText ||
            document.querySelector(".jobs-unified-top-card__job-title")?.innerText ||
            document.querySelector("h1.t-24")?.innerText ||
            document.querySelector("h1")?.innerText || "";
        company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.innerText ||
            document.querySelector(".jobs-unified-top-card__company-name")?.innerText ||
            document.querySelector(".jobs-unified-top-card__subtitle-primary-grouping a")?.innerText ||
            document.querySelector("a.ember-view.t-black.t-normal")?.innerText || "";
        company = company.trim().split('\n')[0]; // Clean up
    } else if (url.includes("indeed.com")) {
        // Indeed
        title = document.querySelector(".jobsearch-JobInfoHeader-title")?.innerText ||
            document.querySelector("h1")?.innerText || "";
        company = document.querySelector("[data-company-name='true']")?.innerText ||
            document.querySelector(".jobsearch-InlineCompanyRating-companyHeader")?.innerText || "";
    }

    return {
        company: company || "Unknown Company",
        position: title || "Unknown Position",
        company_link: url,
        offer_link: url,
        final_status: "Pending",
        dm_sent_date: new Date().toISOString().split('T')[0]
    };
}
