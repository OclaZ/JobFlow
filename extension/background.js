chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "save") {
        const apiUrl = request.apiUrl || "https://job-flow-psi.vercel.app";
        saveApplication(request.data, request.token, apiUrl)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
});

async function saveApplication(data, token, baseUrl) {
    try {
        const url = `${baseUrl.replace(/\/$/, "")}/applications/`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Server error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error saving application:", error);
        throw error;
    }
}
