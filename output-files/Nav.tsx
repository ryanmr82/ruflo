export default function Nav({ active }: { active?: string }) {
  const links = [
    { href: "/", label: "Home", id: "home" },
    { href: "/raids", label: "Raids", id: "raids" },
    { href: "/attendance", label: "Attendance", id: "attendance" },
    { href: "/loot", label: "Loot", id: "loot" },
    { href: "/sr-plus", label: "SR+", id: "sr-plus" },
    { href: "/my-sr", label: "My SR", id: "my-sr" },
    { href: "/logs", label: "Combat Logs", id: "logs" },
    { href: "/analysis", label: "Analysis", id: "analysis" },
    { href: "/architecture", label: "Architecture", id: "architecture" },
    { href: "/admin", label: "Admin", id: "admin" },
  ];

  const externalLinks = [
    { href: "https://raidres.top", label: "Soft Reserve", target: "_blank" },
    { href: "https://pbrigade.gitlab.io/gear-planner/", label: "Gear Planner", target: "_blank" },
    { href: "https://www.turtlogs.com/pve", label: "TurtleLogs", target: "_blank" },
  ];

  return (
    <nav class="nav">
      <div class="nav-container">
        <a href="/" class="nav-brand">
          <span>Thralls Book Club</span>
        </a>

        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation">
          ☰
        </button>

        <ul class="nav-links" id="nav-links">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                class={`nav-link ${active === link.id ? "active" : ""}`}
              >
                {link.label}
              </a>
            </li>
          ))}

          <li style="border-left: 1px solid var(--border-light); margin-left: 8px; padding-left: 8px;">
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                class="nav-link nav-external"
                target={link.target}
                rel="noopener noreferrer"
              >
                {link.label} ↗
              </a>
            ))}
          </li>
        </ul>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('nav-toggle').addEventListener('click', function() {
            document.getElementById('nav-links').classList.toggle('open');
          });
        `
      }} />
    </nav>
  );
}
