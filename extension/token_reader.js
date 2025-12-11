// This script runs in the MAIN World
// It has direct access to the page's window object and Clerk

const checkClerk = () => {
    if (window.Clerk && window.Clerk.session) {
        window.Clerk.session.getToken().then(token => {
            // Send to the Isolated World content script
            window.postMessage({ type: "JOBFLOW_CLERK_TOKEN", token: token }, "*");
        }).catch(err => console.error("JobFlow: Token error", err));
        return true;
    }
    return false;
};

// Check immediately
if (!checkClerk()) {
    // Poll for a bit if not ready
    let attempts = 0;
    const interval = setInterval(() => {
        if (checkClerk() || attempts > 20) {
            clearInterval(interval);
        }
        attempts++;
    }, 1000);
}
