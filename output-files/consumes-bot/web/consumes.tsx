// /routes/consumes.tsx
import { Head } from "$fresh/runtime.ts";
import Nav from "../components/Nav.tsx";
import ConsumesShop from "../islands/ConsumesShop.tsx";

export default function ConsumesPage() {
  return (
    <>
      <Head>
        <title>Guild Consumes | Thralls Book Club</title>
        <meta name="description" content="Guild alchemy consumables - discounted prices for guild members" />
      </Head>
      <Nav active="consumes" />
      <main class="main-content">
        <ConsumesShop />
      </main>
    </>
  );
}
