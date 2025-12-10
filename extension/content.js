chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        const data = scrapeJobDetails();
        sendResponse({ data: data });
    }
});

function scrapeJobDetails() {
    const url = window.location.href;
    let title = "";
    let company = "";
    let location = "";
    let description = "";

    if (url.includes("linkedin.com")) {
        // LinkedIn
        title = document.querySelector(".job-details-jobs-unified-top-card__job-title")?.innerText ||
            document.querySelector("h1")?.innerText || "";
        company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.innerText ||
            document.querySelector(".job-details-jobs-unified-top-card__subtitle a")?.innerText || "";
        // Clean up company name (remove newlines)
        company = company.trim();
    } else if (url.includes("indeed.com")) {
        // Indeed
        title = document.querySelector(".jobsearch-JobInfoHeader-title")?.innerText || "";
        company = document.querySelector("[data-company-name='true']")?.innerText || "";
    }

    return {
        company: company || "Unknown Company",
        position: title || "Unknown Position",
        company_link: url,
        offer_link: url,
        final_status: "Pending",
        dm_sent_date: new Date().toISOString().split('T')[0] // Default to today
    };
}
