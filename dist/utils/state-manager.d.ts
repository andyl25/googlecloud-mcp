import { EventEmitter } from 'events';
/**
 * State manager for the application
 */
declare class StateManager extends EventEmitter {
    private state;
    private static instance;
    /**
     * Get the singleton instance
     */
    static getInstance(): StateManager;
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor();
    /**
     * Initialize the state manager
     */
    private initialize;
    /**
     * Save the state to disk
     */
    private saveState;
    /**
     * Get the current project ID
     *
     * @returns The current project ID or null if not set
     */
    getCurrentProjectId(): string | null;
    /**
     * Set the current project ID
     *
     * @param projectId The project ID to set
     */
    setCurrentProjectId(projectId: string): Promise<void>;
    /**
     * Set the auth initialization state
     *
     * @param initialized Whether auth has been initialized
     */
    setAuthInitialized(initialized: boolean): void;
    /**
     * Get the auth initialization state
     *
     * @returns Whether auth has been initialized
     */
    isAuthInitialized(): boolean;
}
export declare const stateManager: StateManager;
export {};
