import { Head } from "$fresh/runtime.ts";
import Nav from "../components/Nav.tsx";
import MySRPortal from "../islands/MySRPortal.tsx";

export default function MySR() {
  return (
    <>
      <Head>
        <title>My SR+ - Thralls Book Club</title>
      </Head>
      <Nav active="my-sr" />

      <main class="container" style={{ paddingTop: "24px", paddingBottom: "48px" }}>
        <h1 class="page-title" style={{ marginBottom: "24px" }}>My SR+</h1>
        <MySRPortal />
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}
