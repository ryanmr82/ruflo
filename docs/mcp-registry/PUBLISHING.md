# MCP Registry Publishing Guide

## Status

✅ **Completed Steps:**
1. Created detailed GitHub issue (#742) for tracking MCP Registry publishing
2. Configured `server.json` with proper metadata and transport settings
3. Added `mcpName` field to `package.json` 
4. Published claude-flow v2.0.0-alpha.104 to npm with mcpName
5. Built MCP Registry publisher CLI
6. Successfully authenticated with GitHub OAuth
7. Created GitHub Actions workflow for automated publishing

⏳ **Pending:**
- Final publication to MCP Registry (server database issues preventing completion)
- Verification of listing on registry

## Manual Publishing

```bash
# 1. Build the publisher (one-time setup)
cd ~
git clone https://github.com/modelcontextprotocol/registry.git
cd registry
make publisher

# 2. Authenticate
~/registry/bin/mcp-publisher login github
# Follow the device code flow

# 3. Publish
cd /path/to/claude-flow
~/registry/bin/mcp-publisher publish ./server.json
```

## Automated Publishing

The GitHub Actions workflow (`.github/workflows/publish-mcp-registry.yml`) will automatically:
1. Trigger on version tags (v*.*.* or *.*.*-alpha.*)
2. Build the MCP publisher
3. Update server.json with current version
4. Publish to npm if needed
5. Publish to MCP Registry using GitHub OIDC
6. Verify the publication

## Server.json Configuration

```json
{
  "name": "io.github.ruvnet/claude-flow",
  "description": "AI orchestration with hive-mind swarms, neural networks, and 87 MCP tools for enterprise dev.",
  "version": "2.0.0-alpha.104",
  "packages": [
    {
      "registry_type": "npm",
      "identifier": "claude-flow",
      "version": "2.0.0-alpha.104",
      "transport": {
        "type": "stdio"
      }
    }
  ]
}
```

## Important Notes

1. **mcpName Required**: The npm package must include `"mcpName": "io.github.ruvnet/claude-flow"` in package.json
2. **GitHub namespace**: Using `io.github.ruvnet/` requires GitHub authentication
3. **Transport in packages**: The transport configuration must be inside the packages array
4. **Description limit**: Maximum 100 characters for the description field

## Troubleshooting

### Registry Server Issues
If you encounter "conn busy" errors, the registry database may be experiencing issues. Wait and retry.

### Authentication Expired
Tokens expire after some time. Re-authenticate with:
```bash
~/registry/bin/mcp-publisher login github
```

### Package Validation Failed
Ensure the npm package has been published with the mcpName field before attempting registry publication.

## Next Steps

Once the registry server is operational:
1. Run `~/registry/bin/mcp-publisher publish ./server.json`
2. Verify at https://registry.modelcontextprotocol.io/server/io.github.ruvnet/claude-flow
3. Update README with registry installation instructions
4. Test the GitHub Actions workflow with a new release

## Resources

- [MCP Registry](https://github.com/modelcontextprotocol/registry)
- [Publishing Guide](https://github.com/modelcontextprotocol/registry/blob/main/docs/guides/publishing/publish-server.md)
- [GitHub Issue #742](https://github.com/ruvnet/claude-flow/issues/742)