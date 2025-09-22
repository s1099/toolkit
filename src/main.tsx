import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { AppRouter } from "./router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <AppRouter />
  </HashRouter>
);
