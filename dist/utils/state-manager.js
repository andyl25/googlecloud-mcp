/**
 * State Manager for Google Cloud MCP
 *
 * This module provides a central state management system for the application,
 * ensuring consistent access to important state like the current project ID.
 * State is persisted to a file between sessions.
 */
import { configManager } from './config.js';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import os from 'os';
/**
 * Path to the state file
 */
const STATE_DIR = path.join(os.homedir(), '.google-cloud-mcp');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
/**
 * State manager for the application
 */
class StateManager extends EventEmitter {
    state = {
        currentProjectId: null,
        authInitialized: false
    };
    // Singleton instance
    static instance;
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        super();
        this.initialize();
    }
    /**
     * Initialize the state manager
     */
    async initialize() {
        try {
            // Create state directory if it doesn't exist
            if (!fs.existsSync(STATE_DIR)) {
                fs.mkdirSync(STATE_DIR, { recursive: true });
            }
            // Load state from file if it exists
            if (fs.existsSync(STATE_FILE)) {
                try {
                    const stateData = await fs.promises.readFile(STATE_FILE, 'utf-8');
                    const loadedState = JSON.parse(stateData);
                    this.state = { ...this.state, ...loadedState };
                    console.log(`Loaded state from file: ${JSON.stringify(this.state)}`);
                }
                catch (fileError) {
                    console.error('Error loading state from file:', fileError);
                    // Continue with default state
                }
            }
            // Initialize config manager
            await configManager.initialize();
            // If we don't have a project ID from the state file, try to get it from config
            if (!this.state.currentProjectId) {
                const defaultProjectId = configManager.getDefaultProjectId();
                if (defaultProjectId) {
                    await this.setCurrentProjectId(defaultProjectId);
                }
            }
            // Check environment variable as fallback
            if (!this.state.currentProjectId && process.env.GOOGLE_CLOUD_PROJECT) {
                await this.setCurrentProjectId(process.env.GOOGLE_CLOUD_PROJECT);
            }
            console.log(`State manager initialized with project ID: ${this.state.currentProjectId || 'not set'}`);
        }
        catch (error) {
            console.error('Failed to initialize state manager:', error);
        }
    }
    /**
     * Save the state to disk
     */
    async saveState() {
        try {
            // Update the timestamp
            this.state.lastUpdated = Date.now();
            // Write to file
            await fs.promises.writeFile(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
            console.log(`State saved to file: ${JSON.stringify(this.state)}`);
        }
        catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    /**
     * Get the current project ID
     *
     * @returns The current project ID or null if not set
     */
    getCurrentProjectId() {
        return this.state.currentProjectId;
    }
    /**
     * Set the current project ID
     *
     * @param projectId The project ID to set
     */
    async setCurrentProjectId(projectId) {
        if (!projectId) {
            throw new Error('Project ID cannot be empty');
        }
        // Update in-memory state
        this.state.currentProjectId = projectId;
        // Set in environment variable for immediate use
        process.env.GOOGLE_CLOUD_PROJECT = projectId;
        // Update config for persistence
        try {
            await configManager.setDefaultProjectId(projectId);
        }
        catch (error) {
            console.error(`Warning: Could not save project ID to config: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Save state to file
        await this.saveState();
        // Emit change event
        this.emit('projectIdChanged', projectId);
        console.log(`Current project ID set to: ${projectId}`);
    }
    /**
     * Set the auth initialization state
     *
     * @param initialized Whether auth has been initialized
     */
    setAuthInitialized(initialized) {
        this.state.authInitialized = initialized;
        this.emit('authInitialized', initialized);
    }
    /**
     * Get the auth initialization state
     *
     * @returns Whether auth has been initialized
     */
    isAuthInitialized() {
        return this.state.authInitialized;
    }
}
// Export the singleton instance
export const stateManager = StateManager.getInstance();
//# sourceMappingURL=state-manager.js.map