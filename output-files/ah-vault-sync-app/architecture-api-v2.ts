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

// ── Schema validation ──────────────────────────────────────────────
// Validates JSON structure to prevent renderer crashes.
// Returns an array of error strings (empty = valid).

function validateSection(section: string, data: any): string[] {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    errors.push("Root must be a JSON object");
    return errors;
  }

  switch (section) {
    case "changelog":
      if (data.entries !== undefined) {
        if (!Array.isArray(data.entries)) {
          errors.push("'entries' must be an array");
        } else {
          data.entries.forEach((e: any, i: number) => {
            if (typeof e !== "object" || e === null) {
              errors.push(`entries[${i}] must be an object`);
            }
          });
        }
      }
      break;

    case "sitemap":
      if (data.pages !== undefined && !Array.isArray(data.pages)) {
        errors.push("'pages' must be an array");
      }
      if (data.islands !== undefined && !Array.isArray(data.islands)) {
        errors.push("'islands' must be an array");
      }
      break;

    case "database":
      if (data.tables !== undefined && !Array.isArray(data.tables)) {
        errors.push("'tables' must be an array");
      }
      break;

    case "components":
      if (data.sections !== undefined && !Array.isArray(data.sections)) {
        errors.push("'sections' must be an array");
      }
      break;

    case "api-routes":
      if (data.categories !== undefined && !Array.isArray(data.categories)) {
        errors.push("'categories' must be an array");
      }
      break;

    case "integrations":
      if (data.services !== undefined && !Array.isArray(data.services)) {
        errors.push("'services' must be an array");
      }
      break;

    case "dataflows":
      if (data.flows !== undefined && !Array.isArray(data.flows)) {
        errors.push("'flows' must be an array");
      }
      break;

    case "automation":
      if (data.sections !== undefined && !Array.isArray(data.sections)) {
        errors.push("'sections' must be an array");
      }
      break;

    case "future-enhancements":
      // This is the section that caused renderer crashes before.
      // Validate the deeply nested structures the renderer depends on.
      if (data.phases !== undefined) {
        if (!Array.isArray(data.phases)) {
          errors.push("'phases' must be an array");
        } else {
          data.phases.forEach((phase: any, pi: number) => {
            if (typeof phase !== "object" || phase === null) {
              errors.push(`phases[${pi}] must be an object`);
              return;
            }

            // apiEndpoints must be objects with {method, path}
            if (phase.apiEndpoints !== undefined) {
              if (!Array.isArray(phase.apiEndpoints)) {
                errors.push(`phases[${pi}].apiEndpoints must be an array`);
              } else {
                phase.apiEndpoints.forEach((ep: any, ei: number) => {
                  if (typeof ep === "string") {
                    errors.push(
                      `phases[${pi}].apiEndpoints[${ei}] must be an object with {method, path}, got string "${ep.slice(0, 60)}...". ` +
                      `The renderer calls endpoint.method.toLowerCase() which crashes on strings.`
                    );
                  } else if (typeof ep === "object" && ep !== null) {
                    if (typeof ep.method !== "string") {
                      errors.push(`phases[${pi}].apiEndpoints[${ei}].method must be a string`);
                    }
                    if (typeof ep.path !== "string") {
                      errors.push(`phases[${pi}].apiEndpoints[${ei}].path must be a string`);
                    }
                  }
                });
              }
            }

            // files.create/refactor/modify must be objects with {path}
            if (phase.files !== undefined && typeof phase.files === "object") {
              for (const key of ["create", "refactor", "modify"]) {
                const arr = phase.files[key];
                if (arr !== undefined) {
                  if (!Array.isArray(arr)) {
                    errors.push(`phases[${pi}].files.${key} must be an array`);
                  } else {
                    arr.forEach((f: any, fi: number) => {
                      if (typeof f === "string") {
                        errors.push(
                          `phases[${pi}].files.${key}[${fi}] must be an object with {path, ${key === "create" ? "purpose" : "changes"}}, got string. ` +
                          `The renderer accesses file.path which is undefined on strings.`
                        );
                      }
                    });
                  }
                }
              }
            }
          });
        }
      }

      // visualDiagrams validation
      if (data.visualDiagrams !== undefined) {
        if (!Array.isArray(data.visualDiagrams)) {
          errors.push("'visualDiagrams' must be an array");
        } else {
          data.visualDiagrams.forEach((vd: any, vi: number) => {
            if (typeof vd !== "object" || vd === null) return;
            const diagram = vd.diagram;
            if (typeof diagram !== "object" || diagram === null) return;
            if (!Array.isArray(diagram.layers)) return;

            diagram.layers.forEach((layer: any, li: number) => {
              if (!Array.isArray(layer.items)) return;
              layer.items.forEach((item: any, ii: number) => {
                if (typeof item === "string") {
                  errors.push(
                    `visualDiagrams[${vi}].diagram.layers[${li}].items[${ii}] must be an object with {label}, got string "${item.slice(0, 40)}". ` +
                    `The renderer reads item.label which is undefined on strings.`
                  );
                }
              });
            });
          });
        }
      }
      break;
  }

  return errors;
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

  // PUT /api/architecture/:section — write JSON (with backup + schema validation)
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

      // Step 1: Validate it's valid JSON
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Step 2: Schema validation — check structure matches what the renderer expects
      const schemaErrors = validateSection(section, parsed);
      if (schemaErrors.length > 0) {
        return new Response(JSON.stringify({
          error: "Schema validation failed",
          details: schemaErrors,
          hint: "The JSON structure doesn't match what the renderer expects. Fix these issues to prevent rendering crashes.",
        }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }

      const filePath = `${STATIC_DIR}/${filename}`;

      // Step 3: Create backup of existing file
      try {
        const existing = await Deno.readTextFile(filePath);
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        await Deno.writeTextFile(`${filePath}.backup-${timestamp}`, existing);
      } catch {
        // No existing file to backup — that's fine
      }

      // Step 4: Write the new content (pretty-printed)
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
