// TwinLab X Authentication & User Session Service
const AUTH_STORAGE_KEY = "twinlab_auth_session";
const REGISTERED_USERS_KEY = "twinlab_registered_users";

// Default pre-seeded demo accounts
const DEFAULT_DEMO_USERS = [
    {
        id: "usr-demo-1",
        name: "Alex Rivera",
        email: "alex@twinlab.io",
        role: "Embedded Systems Lead",
        avatar: "ri-user-star-line",
        plan: "TwinLab Pro Cloud",
        cloudSyncEnabled: true,
        cloudStorageQuota: "Unlimited Projects",
        joinedDate: "October 2026"
    },
    {
        id: "usr-demo-2",
        name: "Sarah Chen",
        email: "sarah.iot@twinlab.io",
        role: "Robotics & Firmware Dev",
        avatar: "ri-robot-line",
        plan: "TwinLab Pro Cloud",
        cloudSyncEnabled: true,
        cloudStorageQuota: "Unlimited Projects",
        joinedDate: "November 2026"
    }
];

function getStoredSession() {
    try {
        const data = localStorage.getItem(AUTH_STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error("Auth session read error:", e);
    }
    // Default to Guest Engineer if no active session
    return {
        id: "guest-user",
        name: "Guest Engineer",
        email: null,
        isGuest: true,
        role: "Guest Prototyper",
        avatar: "ri-user-smile-line",
        plan: "Free Local Mode",
        cloudSyncEnabled: false,
        cloudStorageQuota: "Local Storage (3 Projects)",
        joinedDate: "Today"
    };
}

let currentSession = getStoredSession();
const listeners = new Set();

function notifyListeners() {
    listeners.forEach((fn) => {
        try {
            fn(currentSession);
        } catch (e) {
            console.error(e);
        }
    });
}

export const authService = {
    getCurrentUser() {
        return currentSession;
    },

    subscribe(callback) {
        listeners.add(callback);
        callback(currentSession);
        return () => listeners.delete(callback);
    },

    // 1. Guest Session
    loginAsGuest() {
        currentSession = {
            id: `guest-${Date.now().toString(36)}`,
            name: "Guest Engineer",
            email: null,
            isGuest: true,
            role: "Guest Prototyper",
            avatar: "ri-user-smile-line",
            plan: "Free Local Mode",
            cloudSyncEnabled: false,
            cloudStorageQuota: "Local Storage (3 Projects)",
            joinedDate: "Today"
        };
        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}
        notifyListeners();
        return currentSession;
    },

    // 2. Email & Password Sign In
    login(email, password) {
        const cleanEmail = (email || "").trim().toLowerCase();
        
        // Check demo accounts first
        let user = DEFAULT_DEMO_USERS.find((u) => u.email.toLowerCase() === cleanEmail);

        // Check custom registered accounts
        if (!user) {
            try {
                const regData = localStorage.getItem(REGISTERED_USERS_KEY);
                const regUsers = regData ? JSON.parse(regData) : [];
                user = regUsers.find((u) => u.email.toLowerCase() === cleanEmail);
            } catch (e) {}
        }

        // If not found, dynamically log in user with clean email & default pro status
        if (!user) {
            const derivedName = cleanEmail.split("@")[0] || "Hardware Engineer";
            user = {
                id: `usr-${Date.now().toString(36)}`,
                name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
                email: cleanEmail,
                role: "Hardware & IoT Developer",
                avatar: "ri-user-3-line",
                plan: "TwinLab Cloud Pro",
                cloudSyncEnabled: true,
                cloudStorageQuota: "Cloud Storage Active",
                joinedDate: "Today"
            };
        }

        currentSession = {
            ...user,
            isGuest: false,
            lastLogin: new Date().toISOString()
        };

        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}
        notifyListeners();
        return currentSession;
    },

    // 3. User Registration
    signup({ name, email, password, role = "Firmware Engineer" }) {
        const cleanEmail = (email || "").trim().toLowerCase();
        const newUser = {
            id: `usr-${Date.now().toString(36)}`,
            name: name || "Hardware Engineer",
            email: cleanEmail,
            role: role || "Maker & Engineer",
            avatar: "ri-user-heart-line",
            plan: "TwinLab Cloud Pro",
            cloudSyncEnabled: true,
            cloudStorageQuota: "Unlimited Cloud Storage",
            joinedDate: "November 2026"
        };

        try {
            const regData = localStorage.getItem(REGISTERED_USERS_KEY);
            const regUsers = regData ? JSON.parse(regData) : [];
            regUsers.push(newUser);
            localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(regUsers));
        } catch (e) {}

        currentSession = {
            ...newUser,
            isGuest: false,
            lastLogin: new Date().toISOString()
        };

        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}
        notifyListeners();
        return currentSession;
    },

    // 4. Quick Demo One-Click Login
    loginDemo() {
        return this.login("alex@twinlab.io", "demo123");
    },

    // 5. Logout
    logout() {
        return this.loginAsGuest();
    }
};

export default authService;
