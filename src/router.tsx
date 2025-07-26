import { Routes, Route } from "react-router";
import { AppLayout } from "./layouts/app-layout";
import { Home, ImageOcr, ImageUpscale } from "./pages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="image">
          <Route path="ocr" element={<ImageOcr />} />
          <Route path="upscale" element={<ImageUpscale />} />
        </Route>
      </Route>
    </Routes>
  );
}
