import { Handlers } from "$fresh/server.ts";

// Map section slugs to file paths
const SECTION_FILES: Record<string, string> = {
  "overview": "architecture-overview.json",
  "changelog": "changelog.json",
  "sitemap": "architecture-sitemap.json",
  "database": "architecture-database.json",
  "components": "architecture-components.json",
  "api-routes": "architecture-api-routes.json",
  "integrations": "architecture-integrations.json",
  "dataflows": "architecture-dataflows.json",
  "automation": "architecture-automation.json",
  "future-enhancements": "architecture-future-enhancements.json",
};

const STATIC_DIR = "/home/opc/tbc-website/static";

function isAuthenticated(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  return cookies.includes("architecture_auth=true");
}

export const handler: Handlers = {
  // GET /api/architecture/:section — read JSON
  async GET(req, ctx) {
    if (!isAuthenticated(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const section = ctx.params.section;
    const filename = SECTION_FILES[section];
    if (!filename) {
      return new Response(JSON.stringify({ error: "Unknown section", validSections: Object.keys(SECTION_FILES) }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const content = await Deno.readTextFile(`${STATIC_DIR}/${filename}`);
      return new Response(content, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: `Failed to read ${filename}: ${err.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // PUT /api/architecture/:section — write JSON (with backup)
  async PUT(req, ctx) {
    if (!isAuthenticated(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const section = ctx.params.section;
    const filename = SECTION_FILES[section];
    if (!filename) {
      return new Response(JSON.stringify({ error: "Unknown section", validSections: Object.keys(SECTION_FILES) }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.text();

      // Validate it's valid JSON
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const filePath = `${STATIC_DIR}/${filename}`;

      // Create backup of existing file
      try {
        const existing = await Deno.readTextFile(filePath);
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        await Deno.writeTextFile(`${filePath}.backup-${timestamp}`, existing);
      } catch {
        // No existing file to backup — that's fine
      }

      // Write the new content (pretty-printed)
      await Deno.writeTextFile(filePath, JSON.stringify(parsed, null, 2));

      return new Response(JSON.stringify({
        success: true,
        section,
        filename,
        size: JSON.stringify(parsed, null, 2).length,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: `Failed to write ${filename}: ${err.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
