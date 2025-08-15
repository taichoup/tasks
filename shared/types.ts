export interface Task {
    id: string;
    title: string;
    checked: boolean;
    lastChecked?: string;
    frequency?: "daily" | "weekly";
}
