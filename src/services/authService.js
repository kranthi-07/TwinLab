// TwinLab X Authentication & User Session Service
import { auth, db, googleProvider, isFirebaseConfigured } from "./firebase";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AUTH_STORAGE_KEY = "twinlab_auth_session";

function withTimeout(promise, ms = 6000, timeoutErrorMsg = "Request timed out. Please check your network connection.") {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutErrorMsg)), ms))
    ]);
}

function getStoredSession() {
    try {
        const data = localStorage.getItem(AUTH_STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error("Auth session read error:", e);
    }
    return {
        id: "guest-user",
        name: "Guest Engineer",
        email: null,
        isGuest: true,
        role: "Guest Prototyper",
        avatar: "ri-user-smile-line",
        plan: "Guest Local Mode",
        cloudSyncEnabled: false,
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

export function formatAuthError(err) {
    if (!err) return "An unexpected error occurred. Please try again.";
    const code = err.code || "";
    const msg = err.message || "";

    if (code === "auth/invalid-email") {
        return "Please enter a valid email address.";
    }
    if (code === "auth/wrong-password") {
        return "Incorrect password. Please verify and try again.";
    }
    if (code === "auth/email-already-in-use") {
        return "This email is already registered. If this is your account, please verify your password.";
    }
    if (code === "auth/weak-password") {
        return "Password is too weak. Please use at least 6 characters.";
    }
    if (code === "auth/popup-closed-by-user") {
        return "Google sign-in popup was closed before completion.";
    }
    if (code === "auth/network-request-failed" || msg.includes("network")) {
        return "Network connection issue. Please check your internet or try again.";
    }
    if (code === "auth/operation-not-allowed") {
        return "Email/Password sign-in is not enabled yet in your Firebase Console (Build > Authentication > Sign-in method).";
    }
    return msg || "Authentication failed. Please try again.";
}

// Background session synchronization with Firebase Auth
if (isFirebaseConfigured && auth) {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const existingSavedPassword = currentSession?.savedPassword || null;
            currentSession = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Hardware Engineer",
                email: firebaseUser.email,
                savedPassword: existingSavedPassword,
                isGuest: false,
                role: "Hardware & IoT Developer",
                avatar: firebaseUser.photoURL || "ri-user-3-line",
                plan: "TwinLab Cloud Pro",
                cloudSyncEnabled: true,
                joinedDate: "Active",
                lastLogin: new Date().toISOString()
            };

            // Background non-blocking profile fetch
            if (db) {
                withTimeout(getDoc(doc(db, "users", firebaseUser.uid)), 1500)
                    .then((userDoc) => {
                        if (userDoc?.exists?.()) {
                            const customRole = userDoc.data().role;
                            if (customRole) {
                                currentSession.role = customRole;
                                notifyListeners();
                            }
                        }
                    })
                    .catch(() => {});
            }
        } else if (!currentSession.isGuest) {
            currentSession = {
                id: `guest-${Date.now().toString(36)}`,
                name: "Guest Engineer",
                email: null,
                isGuest: true,
                role: "Guest Prototyper",
                avatar: "ri-user-smile-line",
                plan: "Guest Local Mode",
                cloudSyncEnabled: false,
                joinedDate: "Today"
            };
        }

        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}
        notifyListeners();
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

    // 1. Instant Guest Account (0ms latency)
    async loginAsGuest() {
        if (isFirebaseConfigured && auth && auth.currentUser) {
            signOut(auth).catch(() => {});
        }

        currentSession = {
            id: `guest-${Date.now().toString(36)}`,
            name: "Guest Engineer",
            email: null,
            savedPassword: null,
            isGuest: true,
            role: "Guest Prototyper",
            avatar: "ri-user-smile-line",
            plan: "Guest Local Mode",
            cloudSyncEnabled: false,
            joinedDate: "Today"
        };

        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}
        notifyListeners();
        return currentSession;
    },

    // 2. Smart Instant Sign In (With Seamless Auto-Registration)
    async login(email, password) {
        const cleanEmail = (email || "").trim().toLowerCase();
        if (!cleanEmail || !password) {
            throw new Error("Please enter both email and password.");
        }

        if (isFirebaseConfigured && auth) {
            let fbUser = null;
            let isNewUser = false;

            try {
                // Try standard sign-in first
                const cred = await withTimeout(
                    signInWithEmailAndPassword(auth, cleanEmail, password),
                    5000,
                    "Sign-in timed out. Please check your internet connection."
                );
                fbUser = cred.user;
            } catch (err) {
                const code = err.code || "";
                const msg = err.message || "";
                
                // If account does not exist yet (or invalid credential), attempt auto-registration!
                if (code === "auth/user-not-found" || code === "auth/invalid-credential" || msg.includes("INVALID_LOGIN_CREDENTIALS")) {
                    if (password.length >= 6) {
                        try {
                            const newCred = await withTimeout(
                                createUserWithEmailAndPassword(auth, cleanEmail, password),
                                5000,
                                "Account setup timed out. Please try again."
                            );
                            fbUser = newCred.user;
                            isNewUser = true;
                        } catch (createErr) {
                            // If create failed with email-already-in-use, then password was genuinely incorrect
                            if (createErr.code === "auth/email-already-in-use") {
                                throw new Error("Incorrect password for this email account.");
                            }
                            throw createErr;
                        }
                    } else {
                        throw new Error("Incorrect password or password must be at least 6 characters.");
                    }
                } else {
                    throw err;
                }
            }

            if (!fbUser) {
                throw new Error("Authentication failed. Please verify credentials.");
            }

            currentSession = {
                id: fbUser.uid,
                name: fbUser.displayName || cleanEmail.split("@")[0],
                email: fbUser.email,
                savedPassword: password || null,
                isGuest: false,
                role: "Hardware & IoT Developer",
                avatar: "ri-user-3-line",
                plan: "TwinLab Cloud Pro",
                cloudSyncEnabled: true,
                joinedDate: isNewUser ? "Today" : "Active",
                lastLogin: new Date().toISOString()
            };

            try {
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
            } catch (e) {}
            notifyListeners();

            // Background non-blocking profile write for new users or fetch for existing
            if (db) {
                if (isNewUser) {
                    setDoc(doc(db, "users", fbUser.uid), {
                        uid: fbUser.uid,
                        name: cleanEmail.split("@")[0],
                        email: cleanEmail,
                        role: "Hardware & IoT Developer",
                        createdAt: new Date().toISOString(),
                        plan: "TwinLab Cloud Pro"
                    }, { merge: true }).catch(() => {});
                } else {
                    getDoc(doc(db, "users", fbUser.uid))
                        .then((snap) => {
                            if (snap?.exists?.() && snap.data().role) {
                                currentSession.role = snap.data().role;
                                notifyListeners();
                            }
                        })
                        .catch(() => {});
                }
            }

            return currentSession;
        }

        // Local mode fallback
        const derivedName = cleanEmail.split("@")[0] || "Engineer";
        currentSession = {
            id: `usr-${Date.now().toString(36)}`,
            name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
            email: cleanEmail,
            savedPassword: password || null,
            role: "Hardware & IoT Developer",
            avatar: "ri-user-3-line",
            plan: "Local Mode",
            cloudSyncEnabled: false,
            isGuest: false,
            joinedDate: "Today",
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        notifyListeners();
        return currentSession;
    },

    // 3. User Registration (Explicit Sign Up tab)
    async signup({ name, email, password, role = "Embedded Systems Dev" }) {
        const cleanEmail = (email || "").trim().toLowerCase();
        if (!cleanEmail || !password) {
            throw new Error("Please provide email and a password.");
        }
        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters long.");
        }

        if (isFirebaseConfigured && auth) {
            const userCredential = await withTimeout(
                createUserWithEmailAndPassword(auth, cleanEmail, password),
                5000,
                "Account creation timed out. Please check your internet connection."
            );
            const fbUser = userCredential.user;

            if (name) {
                updateProfile(fbUser, { displayName: name }).catch(() => {});
            }

            currentSession = {
                id: fbUser.uid,
                name: name || cleanEmail.split("@")[0],
                email: fbUser.email,
                savedPassword: password || null,
                isGuest: false,
                role: role,
                avatar: "ri-user-heart-line",
                plan: "TwinLab Cloud Pro",
                cloudSyncEnabled: true,
                joinedDate: "Today",
                lastLogin: new Date().toISOString()
            };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
            notifyListeners();

            if (db) {
                setDoc(doc(db, "users", fbUser.uid), {
                    uid: fbUser.uid,
                    name: name || cleanEmail.split("@")[0],
                    email: cleanEmail,
                    role: role,
                    createdAt: new Date().toISOString(),
                    plan: "TwinLab Cloud Pro"
                }, { merge: true }).catch(() => {});
            }

            return currentSession;
        }

        currentSession = {
            id: `usr-${Date.now().toString(36)}`,
            name: name || cleanEmail.split("@")[0],
            email: cleanEmail,
            savedPassword: password || null,
            role: role,
            avatar: "ri-user-heart-line",
            plan: "Local Mode",
            cloudSyncEnabled: false,
            isGuest: false,
            joinedDate: "Today",
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        notifyListeners();
        return currentSession;
    },

    // 4. Google Sign-In Popup
    async loginWithGoogle() {
        if (!isFirebaseConfigured || !auth || !googleProvider) {
            throw new Error("Firebase Auth is not configured. Please add your credentials to .env first.");
        }

        const result = await withTimeout(
            signInWithPopup(auth, googleProvider),
            12000,
            "Google sign-in timed out. Please try again."
        );
        const fbUser = result.user;

        currentSession = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0],
            email: fbUser.email,
            isGuest: false,
            role: "Hardware & IoT Developer",
            avatar: fbUser.photoURL || "ri-google-fill",
            plan: "TwinLab Cloud Pro",
            cloudSyncEnabled: true,
            joinedDate: "Active",
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        notifyListeners();

        if (db) {
            setDoc(doc(db, "users", fbUser.uid), {
                uid: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split("@")[0],
                email: fbUser.email,
                avatar: fbUser.photoURL || null,
                lastLogin: new Date().toISOString()
            }, { merge: true }).catch(() => {});
        }

        return currentSession;
    },

    // 5. Update Profile Data
    async updateProfileData({ name, role, avatar, bio, organization, mcuPreference, codePreference }) {
        if (!currentSession) return null;

        const updated = {
            ...currentSession,
            name: name !== undefined ? name : currentSession.name,
            role: role !== undefined ? role : currentSession.role,
            avatar: avatar !== undefined ? avatar : currentSession.avatar,
            bio: bio !== undefined ? bio : currentSession.bio,
            organization: organization !== undefined ? organization : currentSession.organization,
            mcuPreference: mcuPreference !== undefined ? mcuPreference : currentSession.mcuPreference,
            codePreference: codePreference !== undefined ? codePreference : currentSession.codePreference,
            updatedAt: new Date().toISOString()
        };
        currentSession = updated;

        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
        } catch (e) {}

        if (isFirebaseConfigured && auth && auth.currentUser) {
            try {
                if (name) {
                    await updateProfile(auth.currentUser, { displayName: name });
                }
                if (db) {
                    await setDoc(doc(db, "users", auth.currentUser.uid), {
                        name: updated.name,
                        role: updated.role,
                        avatar: updated.avatar,
                        bio: updated.bio || "",
                        organization: updated.organization || "",
                        mcuPreference: updated.mcuPreference || "ESP32-S3",
                        codePreference: updated.codePreference || "C++",
                        updatedAt: updated.updatedAt
                    }, { merge: true });
                }
            } catch (err) {
                console.warn("Firebase profile update notice:", err);
            }
        }

        notifyListeners();
        return currentSession;
    },

    // 6. Logout
    async logout() {
        return this.loginAsGuest();
    }
};

export default authService;
