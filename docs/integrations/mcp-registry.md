# MCP Registry Integration

## Overview

Claude Flow is configured for publication to the official [MCP Registry](https://registry.modelcontextprotocol.io), making it discoverable and easily installable by MCP clients.

## Installation (Once Published)

### Via MCP Client
```bash
# Using Claude Code or other MCP clients
mcp install io.github.ruvnet/claude-flow
```

### Via NPM
```bash
npm install -g claude-flow@alpha
```

## Registry Listing

- **Name**: `io.github.ruvnet/claude-flow`
- **Description**: AI orchestration with hive-mind swarms, neural networks, and 87 MCP tools for enterprise dev.
- **Transport**: stdio
- **Package**: npm (claude-flow)
- **Version**: 2.0.0-alpha.104+

## Features Exposed

The MCP Registry listing includes:

### 🐝 Swarm Coordination (12 tools)
- Initialize swarms with various topologies (hierarchical, mesh, ring, star)
- Spawn specialized AI agents
- Orchestrate complex workflows
- Monitor and scale swarms dynamically

### 🧠 Neural Networks (15 tools)
- Train neural patterns with WASM SIMD acceleration
- Load and save models
- Run inference and predictions
- Pattern recognition and cognitive analysis

### 💾 Memory & Persistence (12 tools)
- Cross-session persistent storage
- Namespace management
- Backup and restore capabilities
- Memory synchronization across instances

### 📊 Analysis & Monitoring (13 tools)
- Performance benchmarks
- Bottleneck analysis
- Token usage tracking
- System health monitoring

### 🔧 Workflow Automation (11 tools)
- Create custom workflows
- SPARC development modes
- CI/CD pipeline creation
- Event-driven automation

### 🐙 GitHub Integration (8 tools)
- Repository analysis
- Pull request management
- Issue tracking
- Release coordination

### 🤖 Dynamic Agent Architecture (8 tools)
- Dynamic agent creation
- Resource allocation
- Consensus mechanisms
- Fault tolerance

## Environment Variables

The following environment variables can be configured:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude AI models | No | Uses client's key |
| `CLAUDE_FLOW_MODE` | Operation mode: development, production, test | No | development |
| `CLAUDE_FLOW_MEMORY_PATH` | Path for persistent memory storage | No | .claude-flow/memory |
| `CLAUDE_FLOW_MAX_AGENTS` | Maximum number of concurrent agents | No | 8 |
| `CLAUDE_FLOW_PORT` | MCP server port | No | 3000 |
| `GITHUB_TOKEN` | GitHub personal access token | No | - |
| `FLOW_NEXUS_API_KEY` | Flow Nexus cloud platform API key | No | - |

## Publishing Status

### ✅ Completed
- [x] server.json configuration
- [x] mcpName added to package.json
- [x] NPM package published with v2.0.0-alpha.104
- [x] MCP Publisher CLI built
- [x] GitHub OAuth authentication
- [x] GitHub Actions workflow created
- [x] Documentation prepared

### ⏳ Pending
- [ ] Final publication to MCP Registry (awaiting server availability)
- [ ] Verification of registry listing

## Automated Publishing

A GitHub Actions workflow automatically publishes to the MCP Registry when:
- A new version tag is pushed (v*.*.* or *.*.*-alpha.*)
- A GitHub release is published

The workflow handles:
1. Building the MCP publisher
2. Updating version synchronization
3. Publishing to npm if needed
4. Publishing to MCP Registry
5. Verification of publication

## Manual Publishing

For maintainers who need to manually publish:

```bash
# One-time setup
cd ~
git clone https://github.com/modelcontextprotocol/registry.git
cd registry
make publisher

# Authenticate
~/registry/bin/mcp-publisher login github

# Publish
cd /path/to/claude-flow
~/registry/bin/mcp-publisher publish ./server.json
```

## Verification

Once published, the server will be available at:
- Registry API: `https://registry.modelcontextprotocol.io/api/v0/servers/io.github.ruvnet/claude-flow`
- Registry Web: `https://registry.modelcontextprotocol.io/server/io.github.ruvnet/claude-flow`

## Support

- [GitHub Issues](https://github.com/ruvnet/claude-flow/issues)
- [MCP Registry Documentation](https://github.com/modelcontextprotocol/registry)
- [Publishing Guide](https://github.com/modelcontextprotocol/registry/blob/main/docs/guides/publishing/publish-server.md)