// TwinLab X Cloud Project Persistence & Synchronization Service
import authService from "./authService";

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

function getCloudVault() {
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
    // Fetch all projects stored in user's cloud vault
    async getCloudProjects() {
        // Realistic cloud sync simulation latency (100ms)
        await new Promise((res) => setTimeout(res, 120));
        return getCloudVault();
    },

    // Save or update an existing project to the cloud
    async saveProjectToCloud(project) {
        if (!project || !project.name) return { success: false, error: "Invalid project data" };

        const user = authService.getCurrentUser();
        const vault = getCloudVault();

        const cloudProject = {
            ...project,
            cloudId: project.cloudId || `cloud-${Date.now().toString(36)}`,
            ownerId: user.id,
            ownerEmail: user.email,
            cloudSynced: true,
            status: "Cloud Synced",
            lastEdited: "Just now",
            updatedAt: new Date().toISOString()
        };

        const existingIndex = vault.findIndex((p) => p.id === project.id || p.cloudId === cloudProject.cloudId);
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

    // Delete a project from cloud
    async deleteFromCloud(projectId) {
        const vault = getCloudVault();
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
