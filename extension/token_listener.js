// This script runs in the ISOLATED World
// It listens for messages from the MAIN world and saves to storage

console.log("JobFlow listener ready...");

// Listen for the message back from the page
window.addEventListener("message", (event) => {
    // Determine origin validity if needed, but for now we trust the page since manifest restricts to our domain
    if (event.data && event.data.type === "JOBFLOW_CLERK_TOKEN") {
        const token = event.data.token;
        if (token) {
            chrome.storage.local.set({ "clerk_token": token }, () => {
                console.log("JobFlow Extension: Token synced!");
                alert("JobFlow: Connected Successfully! You can now use the extension.");
            });
        }
    }
});
