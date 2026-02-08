import { Head } from "$fresh/runtime.ts";
import Nav from "../components/Nav.tsx";
import SRPlusPublic from "../islands/SRPlusPublic.tsx";

export default function SRPlus() {
  return (
    <>
      <Head>
        <title>SR+ Dashboard - Thralls Book Club</title>
      </Head>
      <Nav active="sr-plus" />

      <main class="container" style={{ paddingTop: "24px", paddingBottom: "48px" }}>
        <h1 class="page-title" style={{ marginBottom: "24px" }}>SR+ Dashboard</h1>
        <SRPlusPublic />
      </main>

      <footer class="footer">
        <p>Thralls Book Club - Turtle WoW Guild</p>
      </footer>
    </>
  );
}
