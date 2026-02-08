import { Head } from "$fresh/runtime.ts";
import Nav from "../components/Nav.tsx";
import ArchitectureDocs from "../islands/ArchitectureDocs.tsx";

export default function Architecture() {
  return (
    <>
      <Head>
        <title>Architecture - Thralls Book Club</title>
      </Head>
      <Nav active="architecture" />

      <main class="container">
        <div class="page-header">
          <h1 class="page-title">System Architecture</h1>
          <p class="page-subtitle">Database schema, API routes, and data flow documentation</p>
        </div>

        <ArchitectureDocs />
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}
