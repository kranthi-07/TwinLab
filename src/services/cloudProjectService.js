// TwinLab X Cloud Project Persistence & Synchronization Service (Firestore + Local Backup)
import authService from "./authService";
import { db, isFirebaseConfigured } from "./firebase";
import { 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy 
} from "firebase/firestore";

const CLOUD_PROJECTS_KEY = "twinlab_cloud_vault";
const LOCAL_PROJECTS_KEY = "twinlab_user_projects";

// Sample cloud seed projects
const DEFAULT_CLOUD_PROJECTS = [
    {
        id: "cloud-proj-1",
        name: "IoT Climate Node (ESP32)",
        chip: "ESP32-S3",
        accent: "#FF8A00",
        icon: "ri-cpu-line",
        status: "Synced",
        cloudSynced: true,
        lastEdited: "10 mins ago",
        updatedAt: new Date(Date.now() - 600000).toISOString(),
        components: [
            { id: "esp32-1", type: "esp32-devkit", name: "ESP32 DevKit", x: 256, y: 144, rotation: 0 },
            { id: "led-1", type: "led", name: "Status LED", color: "#38bdf8", x: 440, y: 180, rotation: 0 }
        ],
        wires: []
    },
    {
        id: "cloud-proj-2",
        name: "Traffic Light Sequencer",
        chip: "ATmega328P",
        accent: "#3B9CFF",
        icon: "ri-router-line",
        status: "Synced",
        cloudSynced: true,
        lastEdited: "Yesterday",
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        components: [
            { id: "uno-1", type: "arduino-uno", name: "Arduino Uno", x: 200, y: 160, rotation: 0 }
        ],
        wires: []
    }
];

function getLocalCloudVault() {
    try {
        const data = localStorage.getItem(CLOUD_PROJECTS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    try {
        localStorage.setItem(CLOUD_PROJECTS_KEY, JSON.stringify(DEFAULT_CLOUD_PROJECTS));
    } catch (e) {}
    return DEFAULT_CLOUD_PROJECTS;
}

export const cloudProjectService = {
    // Fetch all projects stored in user's cloud vault (Firestore or local fallback)
    async getCloudProjects() {
        const user = authService.getCurrentUser();

        // 1. Try fetching live from Firebase Firestore if configured
        if (isFirebaseConfigured && db) {
            try {
                const projectsRef = collection(db, "projects");
                let q;
                if (user && user.id && !user.isGuest) {
                    q = query(projectsRef, where("ownerId", "==", user.id));
                } else {
                    q = query(projectsRef);
                }
                const querySnapshot = await Promise.race([
                    getDocs(q),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 2500))
                ]);
                const projects = [];
                querySnapshot.forEach((docSnap) => {
                    projects.push({ ...docSnap.data(), id: docSnap.id, cloudId: docSnap.id });
                });

                if (projects.length > 0) {
                    try {
                        localStorage.setItem(CLOUD_PROJECTS_KEY, JSON.stringify(projects));
                    } catch (e) {}
                    return projects;
                }
            } catch (err) {
                console.warn("⚠️ [TwinLab] Firestore read error, falling back to local vault:", err);
            }
        }

        // 2. Fallback to local storage vault
        await new Promise((res) => setTimeout(res, 80));
        return getLocalCloudVault();
    },

    // Save or update an existing project to Firebase Cloud Firestore
    async saveProjectToCloud(project) {
        if (!project || !project.name) return { success: false, error: "Invalid project data" };

        const user = authService.getCurrentUser();
        const docId = project.cloudId || project.id || `proj-${Date.now().toString(36)}`;

        const cloudProject = {
            ...project,
            id: docId,
            cloudId: docId,
            ownerId: user.id || "guest-user",
            ownerEmail: user.email || "guest@twinlab.io",
            cloudSynced: true,
            status: "Cloud Synced",
            lastEdited: "Just now",
            updatedAt: new Date().toISOString()
        };

        // 1. Write to Firestore if configured
        if (isFirebaseConfigured && db) {
            try {
                const projectDocRef = doc(db, "projects", docId);
                await setDoc(projectDocRef, cloudProject, { merge: true });
                console.log("🔥 [TwinLab] Successfully synced project to Firestore:", docId);
            } catch (err) {
                console.error("❌ [TwinLab] Firestore save error:", err);
            }
        }

        // 2. Always maintain local cache for offline resiliency
        const vault = getLocalCloudVault();
        const existingIndex = vault.findIndex((p) => p.id === docId || p.cloudId === docId);
        let updatedVault;
        if (existingIndex >= 0) {
            updatedVault = [...vault];
            updatedVault[existingIndex] = cloudProject;
        } else {
            updatedVault = [cloudProject, ...vault];
        }

        try {
            localStorage.setItem(CLOUD_PROJECTS_KEY, JSON.stringify(updatedVault));
        } catch (e) {
            console.error("Cloud vault write error:", e);
        }

        return { success: true, project: cloudProject };
    },

    // Delete a project from Firestore and local cache
    async deleteFromCloud(projectId) {
        if (isFirebaseConfigured && db) {
            try {
                await deleteDoc(doc(db, "projects", projectId));
                console.log("🔥 [TwinLab] Successfully deleted project from Firestore:", projectId);
            } catch (err) {
                console.error("❌ [TwinLab] Firestore delete error:", err);
            }
        }

        const vault = getLocalCloudVault();
        const updated = vault.filter((p) => p.id !== projectId && p.cloudId !== projectId);
        try {
            localStorage.setItem(CLOUD_PROJECTS_KEY, JSON.stringify(updated));
        } catch (e) {}
        return { success: true };
    },

    // Download project as .twin JSON file
    exportProjectFile(project) {
        try {
            const exportPayload = {
                twinlab_version: "2.4-X",
                exported_at: new Date().toISOString(),
                project: {
                    ...project,
                    cloudSynced: true
                }
            };
            const jsonStr = JSON.stringify(exportPayload, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(project.name || "twinlab-project").toLowerCase().replace(/\s+/g, "_")}.twin`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (e) {
            console.error("Export error:", e);
            return false;
        }
    }
};

export default cloudProjectService;
