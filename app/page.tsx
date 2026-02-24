import { loadAllPortfolios } from "@/lib/data-loader";
import { computeLayout } from "@/lib/layout-engine";
import { HomeView } from "@/components/HomeView";

export default function HomePage() {
  const { portfolios, catalog } = loadAllPortfolios();
  const layouts = portfolios.map((p) => computeLayout(p));

  return <HomeView layouts={layouts} catalog={catalog} />;
}
