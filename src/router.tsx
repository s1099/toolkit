import { Route, Routes } from "react-router";
import { AppLayout } from "./layouts/app-layout";
import { navGroups } from "./lib/navigation";
import { Home } from "./pages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        {navGroups.map((group) => (
          <Route key={group.label} path={group.label}>
            {group.items.map((item) => (
              <Route
                key={`${group.label.toLowerCase()}/${item.slug}`}
                path={item.slug}
                element={<item.element />}
              />
            ))}
          </Route>
        ))}
      </Route>
    </Routes>
  );
}
