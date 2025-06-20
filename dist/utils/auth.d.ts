/**
 * Authentication utilities for Google Cloud services
 */
import { GoogleAuth } from 'google-auth-library';
export declare let authClient: GoogleAuth | null;
/**
 * Initialises Google Cloud authentication using either:
 * 1. GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to a service account file
 * 2. GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables
 *
 * This function supports lazy loading - it won't fail if credentials aren't available yet,
 * allowing the server to start without authentication and defer it until needed.
 *
 * Authentication is required for operation but can be lazy-loaded when first needed rather than
 * at startup, which helps prevent timeouts with Smithery.
 *
 * @param requireAuth If true, will throw an error if authentication fails. If false, will return null.
 * @returns Promise resolving to the authenticated GoogleAuth client or null if authentication isn't available
 */
export declare function initGoogleAuth(requireAuth?: boolean): Promise<GoogleAuth | null>;
/**
 * Gets the project ID from the state manager, environment variables, or from the authenticated client
 *
 * @param requireAuth If true, will throw an error if project ID can't be determined. If false, will return a default value.
 * @returns Promise resolving to the Google Cloud project ID or a default value if not available
 */
export declare function getProjectId(requireAuth?: boolean): Promise<string>;
/**
 * Sets the default project ID to use for all Google Cloud operations
 *
 * @param projectId The project ID to set as default
 */
export declare function setProjectId(projectId: string): Promise<void>;
/**
 * Gets the list of recently used project IDs
 *
 * @returns Array of recent project IDs
 */
export declare function getRecentProjectIds(): Promise<string[]>;
