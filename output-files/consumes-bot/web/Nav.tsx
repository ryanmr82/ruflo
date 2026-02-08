export default function Nav({ active }: { active?: string }) {
  const links = [
    { href: "/", label: "Home", id: "home" },
    { href: "/raids", label: "Raid Calendar", id: "raids" },
    { href: "/raid-reports", label: "Raid Analysis", id: "raid-reports" },
    { href: "/logs", label: "Upload Logs", id: "logs" },
    { href: "/architecture", label: "Architecture", id: "architecture" },
    // Hidden for now - don't delete
    // { href: "/my-sr", label: "My SR+", id: "my-sr" },
    // { href: "/sr-plus", label: "SR+ System", id: "sr-plus" },
    { href: "/admin", label: "Admin", id: "admin" },
  ];

  const lootLinks = [
    { href: "/loot", label: "Loot History" },
    { href: "/loot-analytics", label: "Loot Analytics" },
  ];

  const playerLinks = [
    { href: "/attendance", label: "Attendance" },
    { href: "/analysis", label: "Player Stats" },
    { href: "/player-analytics", label: "Player Analytics" },
  ];

  const logsLinks = [
    { href: "/turtlelogs", label: "View Logs" },
    { href: "/logs", label: "Upload Logs" },
  ];

  const externalLinks = [
    { href: "https://honorspy.duckdns.org/", label: "Honor Spy", target: "_blank" },
    { href: "https://raidres.top", label: "Soft Reserve", target: "_blank" },
    { href: "https://pbrigade.gitlab.io/gear-planner/", label: "Gear Planner", target: "_blank" },
    { href: "https://www.turtlogs.com/armory/guild/Turtle%20WoW%20TelAbim/Thralls%20Book%20Club", label: "Turtle Logs", target: "_blank" },
    { href: "https://turtlecraft.gg/armory/", label: "Armory", target: "_blank" },
    { href: "https://database.turtlecraft.gg/", label: "Database", target: "_blank" },
    { href: "https://www.wowauctions.net/", label: "Auctions", target: "_blank" },
    { href: "https://talent-builder.haaxor1689.dev/c/1.18.0", label: "Talent Calculator", target: "_blank" },
    { href: "https://telabim-timer.deno.dev/", label: "Reset Timers", target: "_blank" },
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
          {/* Home */}
          <li key="home">
            <a href="/" class={`nav-link ${active === "home" ? "active" : ""}`}>
              Home
            </a>
          </li>

          {/* Raid Calendar */}
          <li key="raids">
            <a href="/raids" class={`nav-link ${active === "raids" ? "active" : ""}`}>
              Raid Calendar
            </a>
          </li>

          {/* Consumes */}
          <li key="consumes">
            <a href="/consumes" class={`nav-link ${active === "consumes" ? "active" : ""}`}>
              Consumes
            </a>
          </li>

          {/* SR Plus */}
          <li key="sr-plus">
            <a href="/sr-plus" class={`nav-link ${active === "sr-plus" ? "active" : ""}`}>
              SR Plus
            </a>
          </li>

          {/* Logs Dropdown */}
          <li style="position: relative;">
            <a onclick="toggleDropdown('logsDropdown'); return false;" class={`nav-link ${active === "logs" || active === "turtlelogs" ? "active" : ""}`} style="cursor: pointer;">
              Logs ▾
            </a>
            <div id="logsDropdown" class="nav-dropdown-menu">
              {logsLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  class="nav-dropdown-item"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </li>

          {/* Players Dropdown */}
          <li style="position: relative;">
            <a onclick="toggleDropdown('playersDropdown'); return false;" class={`nav-link ${active === "attendance" || active === "analysis" || active === "player-analytics" ? "active" : ""}`} style="cursor: pointer;">
              Players ▾
            </a>
            <div id="playersDropdown" class="nav-dropdown-menu">
              {playerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  class="nav-dropdown-item"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </li>

          {/* Loot Dropdown */}
          <li style="position: relative;">
            <a onclick="toggleDropdown('lootDropdown'); return false;" class={`nav-link ${active === "loot" ? "active" : ""}`} style="cursor: pointer;">
              Loot ▾
            </a>
            <div id="lootDropdown" class="nav-dropdown-menu">
              {lootLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  class="nav-dropdown-item"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </li>

          {/* Raid Analysis */}
          <li key="raid-reports">
            <a href="/raid-reports" class={`nav-link ${active === "raid-reports" ? "active" : ""}`}>
              Raid Analysis
            </a>
          </li>

          {/* Architecture */}
          <li key="architecture">
            <a href="/architecture" class={`nav-link ${active === "architecture" ? "active" : ""}`}>
              Architecture
            </a>
          </li>

          {/* Admin */}
          <li key="admin">
            <a href="/admin" class={`nav-link ${active === "admin" ? "active" : ""}`}>
              Admin
            </a>
          </li>

          {/* External Resources Dropdown */}
          <li style="position: relative;">
            <a onclick="toggleDropdown('myDropdown'); return false;" class="nav-link" style="color: var(--apple-orange); cursor: pointer;">
              External Resources ▾
            </a>
            <div id="myDropdown" class="nav-dropdown-menu">
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.target}
                  rel="noopener noreferrer"
                  class="nav-dropdown-item-external"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </li>
        </ul>
      </div>

      {/* WoW-style decorative border at bottom of nav */}
      <div class="nav-decoration"></div>

      <style>{`
        .nav-decoration {
          position: absolute;
          bottom: -35px;
          left: 0;
          width: 100%;
          height: 50px;
          background-image: url('/images/nav-decoration.png');
          background-repeat: repeat-x;
          background-size: auto 100%;
          background-position: center top;
          z-index: 100;
          pointer-events: none;
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('nav-toggle').addEventListener('click', function() {
            document.getElementById('nav-links').classList.toggle('open');
          });

          // Helper function to close all dropdowns
          function closeAllDropdowns() {
            var dropdowns = document.getElementsByClassName("show-dropdown");
            for (var i = dropdowns.length - 1; i >= 0; i--) {
              dropdowns[i].classList.remove('show-dropdown');
            }
          }

          // Toggle dropdown and close others
          window.toggleDropdown = function(dropdownId) {
            var dropdown = document.getElementById(dropdownId);
            var isOpen = dropdown.classList.contains('show-dropdown');
            closeAllDropdowns();
            if (!isOpen) {
              dropdown.classList.add('show-dropdown');
            }
          }

          // Close dropdown when clicking outside
          window.onclick = function(event) {
            if (!event.target.matches('.nav-link')) {
              closeAllDropdowns();
            }
          }
        `
      }} />
    </nav>
  );
}
