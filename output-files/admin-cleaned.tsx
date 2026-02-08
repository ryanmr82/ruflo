import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Nav from "../components/Nav.tsx";

/**
 * Admin page - cleaned up, removed unused "Create New Run from Discord" UI
 */

interface PageData {
  isAuthenticated: boolean;
  error?: string;
  message?: string;
}

const ADMIN_PASSWORD = "thralls2024";

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const cookies = req.headers.get("cookie") || "";
    const isAuthenticated = cookies.includes("admin_auth=true");
    const message = url.searchParams.get("message") || undefined;

    return ctx.render({ isAuthenticated, message });
  },

  async POST(req, ctx) {
    const form = await req.formData();
    const password = form.get("password") as string;
    const action = form.get("action") as string;

    if (action === "login") {
      if (password === ADMIN_PASSWORD) {
        const headers = new Headers();
        headers.set("Set-Cookie", "admin_auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400");
        headers.set("Location", "/admin");
        return new Response(null, { status: 303, headers });
      } else {
        return ctx.render({ isAuthenticated: false, error: "Invalid password" });
      }
    }

    if (action === "logout") {
      const headers = new Headers();
      headers.set("Set-Cookie", "admin_auth=; Path=/; HttpOnly; Max-Age=0");
      headers.set("Location", "/admin");
      return new Response(null, { status: 303, headers });
    }

    return ctx.render({ isAuthenticated: false });
  },
};

export default function Admin({ data }: PageProps<PageData>) {
  const { isAuthenticated, error, message } = data;

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login - Thralls Book Club</title>
          <style>{`
            .login-container {
              max-width: 400px;
              margin: 100px auto;
              padding: 32px;
              background: var(--bg-tertiary);
              border-radius: 12px;
            }
            .login-container h2 {
              margin: 0 0 24px 0;
              text-align: center;
            }
            .login-container input {
              width: 100%;
              padding: 12px;
              margin-bottom: 16px;
              border: 1px solid var(--border-light);
              border-radius: 6px;
              background: var(--background-secondary);
              color: var(--text-primary);
              box-sizing: border-box;
            }
            .login-container button {
              width: 100%;
            }
            .login-error {
              color: var(--apple-red);
              text-align: center;
              margin-bottom: 16px;
            }
          `}</style>
        </Head>
        <Nav active="admin" />
        <main class="container">
          <div class="login-container">
            <h2>Admin Login</h2>
            {error && <p class="login-error">{error}</p>}
            <form method="POST">
              <input type="hidden" name="action" value="login" />
              <input type="password" name="password" placeholder="Enter admin password" required />
              <button type="submit" class="btn btn-primary">Login</button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Thralls Book Club</title>
        <style>{`
          .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .admin-card {
            background: var(--bg-tertiary);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .admin-card h3 {
            margin: 0 0 16px 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
          }
          .logout-btn {
            background: transparent;
            border: 1px solid var(--border-light);
            color: var(--text-secondary);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
          }
          .message {
            background: rgba(242, 73, 92, 0.1);
            color: var(--apple-red);
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
          }
          .admin-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }
          .admin-link {
            background: var(--bg-secondary);
            border: 1px solid var(--border-light);
            border-radius: 8px;
            padding: 20px;
            text-decoration: none;
            color: var(--text-primary);
            transition: all 0.2s;
          }
          .admin-link:hover {
            border-color: var(--apple-blue);
            background: rgba(87, 148, 242, 0.1);
          }
          .admin-link h4 {
            margin: 0 0 8px 0;
            color: var(--apple-blue);
          }
          .admin-link p {
            margin: 0;
            font-size: 13px;
            color: var(--text-secondary);
          }
        `}</style>
      </Head>
      <Nav active="admin" />

      <main class="container">
        <div class="admin-header">
          <h1 class="page-title">Admin Panel</h1>
          <form method="POST" style="display: inline;">
            <input type="hidden" name="action" value="logout" />
            <button type="submit" class="logout-btn">Logout</button>
          </form>
        </div>

        {message && <div class="message">{decodeURIComponent(message.replace(/\+/g, " "))}</div>}

        <div class="admin-card">
          <h3>Admin Tools</h3>
          <div class="admin-links">
            <a href="/admin/sr-plus" class="admin-link">
              <h4>SR+ Manager</h4>
              <p>Manage player SR+ entries, view logs, and adjust settings</p>
            </a>
            <a href="/admin/items" class="admin-link">
              <h4>Item Database</h4>
              <p>Browse and search WoW items with icons and tooltips</p>
            </a>
          </div>
        </div>

        <div class="admin-card">
          <h3>System Info</h3>
          <p style="color: var(--text-secondary); margin: 0 0 8px 0;">
            SR+ system is active. Players can set their SR+ picks on the My SR page.
          </p>
          <p style="color: var(--text-tertiary); margin: 0; font-size: 13px;">
            Admin actions are logged in the SR+ Manager admin log tab.
          </p>
        </div>
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}
