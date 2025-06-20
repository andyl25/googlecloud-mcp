/**
 * Configuration manager for Google Cloud MCP
 */
export declare class ConfigManager {
    private config;
    private initialized;
    /**
     * Create a new ConfigManager instance
     */
    constructor();
    /**
     * Initialize the configuration manager
     */
    initialize(): Promise<void>;
    /**
     * Save the configuration to disk
     */
    private saveConfig;
    /**
     * Get the default project ID
     *
     * @returns The default project ID or undefined if not set
     */
    getDefaultProjectId(): string | undefined;
    /**
     * Set the default project ID
     *
     * @param projectId The project ID to set as default
     */
    setDefaultProjectId(projectId: string): Promise<void>;
    /**
     * Add a project ID to the list of recent projects
     *
     * @param projectId The project ID to add
     */
    addToRecentProjects(projectId: string): Promise<void>;
    /**
     * Get the list of recent project IDs
     *
     * @returns Array of recent project IDs
     */
    getRecentProjectIds(): string[];
}
export declare const configManager: ConfigManager;
