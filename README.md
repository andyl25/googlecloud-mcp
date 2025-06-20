# Google Cloud MCP Server

A Model Context Protocol (MCP) server for Google Cloud services including Logging, Spanner, Monitoring, and Cloud Trace.

<a href="https://glama.ai/mcp/servers/@andyl25/googlecloud-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@andyl25/googlecloud-mcp/badge" alt="Google Cloud Server MCP server" />
</a>

## Features

- **Google Cloud Logging**: Query logs, list log entries, and search across different log sources
- **Google Cloud Spanner**: Execute queries, list databases and instances, get schema information
- **Google Cloud Monitoring**: Query metrics, list metric descriptors, get monitoring data
- **Google Cloud Trace**: Retrieve trace data and analyze distributed system performance
- **Resource Discovery**: Automatically discover and list available Google Cloud resources
- **Project Management**: Tools for managing Google Cloud project settings

## Transport Support

This server supports two transport modes:

### 1. Stdio Transport (Default)
The traditional MCP stdio transport for use with MCP clients like Claude Desktop.

### 2. HTTP Transport (New!)
A web-based HTTP transport implementing the [MCP Streamable HTTP specification](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http).

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd google-cloud-mcp

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Configuration

### Environment Variables

- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google Cloud service account key file
- `GOOGLE_CLOUD_PROJECT`: Your default Google Cloud project ID
- `GOOGLE_CLIENT_EMAIL`: Service account email (alternative to credentials file)
- `GOOGLE_PRIVATE_KEY`: Service account private key (alternative to credentials file)
- `LAZY_AUTH`: Set to 'false' to initialize auth immediately (default: 'true')
- `DEBUG`: Set to 'true' for debug logging
- `MCP_TRANSPORT`: Transport type - 'stdio' (default) or 'http'
- `MCP_HTTP_PORT`: Port for HTTP transport (default: 3000)

### Google Cloud Authentication

You can authenticate in several ways:

1. **Service Account Key File** (Recommended):
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```

2. **Environment Variables**:
   ```bash
   export GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **Application Default Credentials**: If running on Google Cloud, ADC will be used automatically.

## Usage

### Using Stdio Transport (Default)

```bash
# Start with stdio transport
pnpm start

# Or explicitly specify stdio
MCP_TRANSPORT=stdio pnpm start
```

### Using HTTP Transport

```bash
# Start with HTTP transport
MCP_TRANSPORT=http pnpm start

# Or with custom port
MCP_TRANSPORT=http MCP_HTTP_PORT=8080 pnpm start
```

When using HTTP transport, the server will be available at:
- **MCP Endpoint**: `http://127.0.0.1:3000/mcp`
- **Health Check**: `http://127.0.0.1:3000/health`

### HTTP Transport Features

The HTTP transport implements the MCP Streamable HTTP specification with:

- **Session Management**: Automatic session ID assignment and tracking
- **Server-Sent Events (SSE)**: For real-time communication and server-initiated messages
- **Request/Response Handling**: Proper JSON-RPC 2.0 message handling
- **Security**: Origin validation to prevent DNS rebinding attacks
- **CORS Support**: Cross-origin requests support for web applications
- **Connection Management**: Automatic cleanup of stale connections

### HTTP Transport Usage Examples

#### Initialize Connection
```bash
curl -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

The response will include a `Mcp-Session-Id` header that should be used in subsequent requests.

#### Make Requests with Session
```bash
curl -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Mcp-Session-Id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

#### Server-Sent Events Stream
```bash
curl -X GET http://127.0.0.1:3000/mcp \
  -H "Accept: text/event-stream" \
  -H "Mcp-Session-Id: <session-id>"
```

## Available Tools

### Logging Tools
- `gcp-logging-query`: Query Google Cloud Logs
- `gcp-logging-list-entries`: List log entries with filters

### Spanner Tools
- `gcp-spanner-execute-query`: Execute SQL queries on Spanner databases
- `gcp-spanner-list-databases`: List Spanner databases
- `gcp-spanner-list-instances`: List Spanner instances
- `gcp-spanner-get-schema`: Get database schema information
- `gcp-spanner-query-count`: Get query execution metrics

### Monitoring Tools
- `gcp-monitoring-query`: Query monitoring metrics
- `gcp-monitoring-list-metrics`: List available metric descriptors
- `gcp-monitoring-get-resource-metrics`: Get metrics for specific resources

### Trace Tools
- `get-trace`: Retrieve trace data by trace ID
- `search-traces`: Search for traces with filters
- `get-trace-summary`: Get summary statistics for traces

### Project Tools
- `gcp-get-project-info`: Get current project information
- `gcp-list-enabled-services`: List enabled APIs and services

## Available Resources

### Logging Resources
- `gcp://logging/logs/{logName}`: Individual log resources
- `gcp://logging/entries`: Recent log entries

### Spanner Resources
- `gcp://spanner/instances`: List of Spanner instances
- `gcp://spanner/databases/{instanceId}`: Databases in an instance
- `gcp://spanner/schema/{instanceId}/{databaseId}`: Database schema

### Monitoring Resources
- `gcp://monitoring/metrics`: Available monitoring metrics
- `gcp://monitoring/resources`: Monitored resource types

### Trace Resources
- `gcp://trace/traces`: Recent trace data

## Available Prompts

- `analyze-logs`: Analyze log patterns and errors
- `query-optimization`: Optimize Spanner queries
- `troubleshoot-performance`: Troubleshoot application performance issues
- `security-analysis`: Analyze security-related logs and traces

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode with stdio transport
pnpm dev

# Run in development mode with HTTP transport
MCP_TRANSPORT=http pnpm dev

# Build the project
pnpm build

# Run tests
pnpm test

# Lint the code
pnpm lint

# Format the code
pnpm format
```

## Troubleshooting

### Authentication Issues

1. **Check your credentials**:
   ```bash
   gcloud auth application-default login
   ```

2. **Verify service account permissions**:
   - Logging Viewer
   - Spanner Database User
   - Monitoring Viewer
   - Cloud Trace User

3. **Test authentication**:
   ```bash
   DEBUG=true pnpm start
   ```

### HTTP Transport Issues

1. **Port conflicts**: If port 3000 is in use, specify a different port:
   ```bash
   MCP_HTTP_PORT=8080 MCP_TRANSPORT=http pnpm start
   ```

2. **CORS issues**: The server only accepts requests from localhost, 127.0.0.1, and .local domains for security.

3. **Session management**: Make sure to include the `Mcp-Session-Id` header in requests after initialization.

### Performance Issues

1. **Enable lazy authentication**:
   ```bash
   LAZY_AUTH=true pnpm start
   ```

2. **Reduce logging verbosity**: Remove `DEBUG=true` from production environments.

## Security Considerations

### HTTP Transport Security

- The server binds only to `127.0.0.1` (localhost) by default
- Origin header validation prevents DNS rebinding attacks
- Sessions are automatically cleaned up
- Request timeouts prevent resource exhaustion

### Google Cloud Security

- Use service accounts with minimal required permissions
- Regularly rotate service account keys
- Monitor access logs for unusual activity
- Use VPC-native clusters when possible

## License

MIT License - see LICENSE file for details.