import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { StrictMode } from "react";
import { AppRouter } from "./router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </StrictMode>
);
