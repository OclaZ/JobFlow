// This script runs in the Isolated World
// We inject a script into the Main World to access window.Clerk

const script = document.createElement('script');
script.textContent = `
    const sendToken = async () => {
        if (window.Clerk && window.Clerk.session) {
            try {
                const token = await window.Clerk.session.getToken();
                window.postMessage({ type: "JOBFLOW_CLERK_TOKEN", token: token }, "*");
            } catch (e) {
                console.error("JobFlow Extension: Error getting token", e);
            }
        }
    };

    // Check periodically for Clerk to be ready
    let attempts = 0;
    const interval = setInterval(() => {
        if (window.Clerk && window.Clerk.session) {
            sendToken();
            clearInterval(interval);
        }
        attempts++;
        if (attempts > 20) clearInterval(interval); // Stop after 20s
    }, 1000);
`;
(document.head || document.documentElement).appendChild(script);
script.remove();

// Listen for the message back from the page
window.addEventListener("message", (event) => {
    // Determine origin validity if needed, but for now we trust the page since manifest restricts to our domain
    if (event.data && event.data.type === "JOBFLOW_CLERK_TOKEN") {
        const token = event.data.token;
        if (token) {
            chrome.storage.local.set({ "clerk_token": token }, () => {
                console.log("JobFlow Extension: Token synced!");
            });
        }
    }
});
