import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import SRPlusSpreadsheet from "../../islands/SRPlusSpreadsheet.tsx";

interface SRPlusPageData {
  isAdmin: boolean;
}

export const handler: Handlers<SRPlusPageData> = {
  async GET(req, ctx) {
    // TODO: Add proper admin check via Discord OAuth
    // For now, allow access (will add auth in Phase 2)
    return ctx.render({ isAdmin: true });
  },
};

export default function SRPlusAdminPage({ data }: PageProps<SRPlusPageData>) {
  if (!data.isAdmin) {
    return (
      <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-red-500">Access Denied</h1>
          <p class="mt-2 text-gray-400">You must be an admin to access this page.</p>
          <a href="/" class="mt-4 inline-block text-blue-400 hover:underline">Return Home</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>SR+ Admin - TBC Guild</title>
        <style>{`
          .sr-plus-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .raid-tab {
            padding: 8px 16px;
            border-radius: 6px 6px 0 0;
            cursor: pointer;
            transition: all 0.2s;
          }
          .raid-tab:hover {
            background: rgba(255,255,255,0.1);
          }
          .raid-tab.active {
            background: #1f2937;
            border-bottom: 2px solid #3b82f6;
          }
          .spreadsheet-table {
            width: 100%;
            border-collapse: collapse;
          }
          .spreadsheet-table th,
          .spreadsheet-table td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #374151;
          }
          .spreadsheet-table th {
            background: #1f2937;
            font-weight: 600;
            position: sticky;
            top: 0;
          }
          .spreadsheet-table tr:hover {
            background: rgba(59, 130, 246, 0.1);
          }
          .editable-cell {
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
          }
          .editable-cell:hover {
            background: rgba(59, 130, 246, 0.2);
          }
          .editable-cell input {
            background: #374151;
            border: 1px solid #4b5563;
            border-radius: 4px;
            padding: 4px 8px;
            color: white;
            width: 60px;
          }
        `}</style>
      </Head>
      <div class="min-h-screen bg-gray-900 text-white sr-plus-container">
        <div class="max-w-7xl mx-auto px-4 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold">SR+ Credit Manager</h1>
              <p class="text-gray-400 mt-1">Manage soft reserve bonus credits across all raids</p>
            </div>
            <a href="/admin" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              ← Back to Admin
            </a>
          </div>

          <SRPlusSpreadsheet />
        </div>
      </div>
    </>
  );
}
