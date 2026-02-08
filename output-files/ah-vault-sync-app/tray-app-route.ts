import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req) {
    const cookies = req.headers.get("cookie") || "";
    if (!cookies.includes("admin_auth=true")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filePath = "./static/downloads/AH-Vault-Sync-Setup-6.0.0.zip";
    try {
      const file = await Deno.readFile(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="AH-Vault-Sync-Setup-6.0.0.zip"',
        },
      });
    } catch {
      return new Response("File not found", { status: 404 });
    }
  },
};
