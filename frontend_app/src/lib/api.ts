const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("token");
    }
    return null;
};

export const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
    }
};

export const removeAuthToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
    }
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    } as HeadersInit;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Handle unauthorized (logout)
        removeAuthToken();
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "API Request Failed");
    }

    return response.json();
};
