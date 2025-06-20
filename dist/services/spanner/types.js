/**
 * Type definitions for Google Cloud Spanner service
 */
import { Spanner } from '@google-cloud/spanner';
import { GcpMcpError } from '../../utils/error.js';
/**
 * Initialises the Google Cloud Spanner client
 *
 * @returns A configured Spanner client
 */
export async function getSpannerClient() {
    // Import the state manager here to avoid circular dependencies
    const { stateManager } = await import('../../utils/state-manager.js');
    // Get the project ID from state manager
    let projectId = stateManager.getCurrentProjectId();
    // If not available in state manager, try to get it from auth
    if (!projectId) {
        const { getProjectId } = await import('../../utils/auth.js');
        projectId = await getProjectId();
    }
    if (!projectId) {
        throw new GcpMcpError('Unable to detect a Project ID in the current environment.\nTo learn more about authentication and Google APIs, visit:\nhttps://cloud.google.com/docs/authentication/getting-started', 'UNAUTHENTICATED', 401);
    }
    console.log(`Initializing Spanner client with project ID: ${projectId}`);
    return new Spanner({
        projectId: projectId
    });
}
/**
 * Gets the Spanner instance and database from environment variables or parameters
 *
 * @param instanceId Optional instance ID (defaults to environment variable)
 * @param databaseId Optional database ID (defaults to environment variable)
 * @returns The instance and database IDs
 */
export async function getSpannerConfig(instanceId, databaseId) {
    const instance = instanceId || process.env.SPANNER_INSTANCE;
    const database = databaseId || process.env.SPANNER_DATABASE;
    if (!instance) {
        throw new GcpMcpError('Spanner instance ID not provided. Set SPANNER_INSTANCE environment variable or provide instanceId parameter.', 'INVALID_ARGUMENT', 400);
    }
    if (!database) {
        throw new GcpMcpError('Spanner database ID not provided. Set SPANNER_DATABASE environment variable or provide databaseId parameter.', 'INVALID_ARGUMENT', 400);
    }
    return { instanceId: instance, databaseId: database };
}
//# sourceMappingURL=types.js.map