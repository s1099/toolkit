---
title: Routing
order: 2
---

# Routing

[MODES: declarative]

## Configuring Routes

Routes are configured by rendering `<Routes>` and `<Route>` that couple URL segments to UI elements.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  </BrowserRouter>
);
```

Here's a larger sample config:

```tsx
<Routes>
  <Route index element={<Home />} />
  <Route path="about" element={<About />} />

  <Route element={<AuthLayout />}>
    <Route path="login" element={<Login />} />
    <Route path="register" element={<Register />} />
  </Route>

  <Route path="concerts">
    <Route index element={<ConcertsHome />} />
    <Route path=":city" element={<City />} />
    <Route path="trending" element={<Trending />} />
  </Route>
</Routes>
```

## Nested Routes

Routes can be nested inside parent routes.

```tsx
<Routes>
  <Route path="dashboard" element={<Dashboard />}>
    <Route index element={<Home />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

The path of the parent is automatically included in the child, so this config creates both `"/dashboard"` and `"/dashboard/settings"` URLs.

Child routes are rendered through the `<Outlet/>` in the parent route.

```tsx filename=app/dashboard.tsx
import { Outlet } from "react-router";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* will either be <Home/> or <Settings/> */}
      <Outlet />
    </div>
  );
}
```

## Layout Routes

Routes _without_ a `path` create new nesting for their children, but they don't add any segments to the URL.

```tsx lines=[2,9]
<Routes>
  <Route element={<MarketingLayout />}>
    <Route index element={<MarketingHome />} />
    <Route path="contact" element={<Contact />} />
  </Route>

  <Route path="projects">
    <Route index element={<ProjectsHome />} />
    <Route element={<ProjectsLayout />}>
      <Route path=":pid" element={<Project />} />
      <Route path=":pid/edit" element={<EditProject />} />
    </Route>
  </Route>
</Routes>
```

## Index Routes

Index routes render into their parent's `<Outlet/>` at their parent's URL (like a default child route). They are configured with the `index` prop:

```tsx lines=[4,8]
<Routes>
  <Route path="/" element={<Root />}>
    {/* renders into the outlet in <Root> at "/" */}
    <Route index element={<Home />} />

    <Route path="dashboard" element={<Dashboard />}>
      {/* renders into the outlet in <Dashboard> at "/dashboard" */}
      <Route index element={<DashboardHome />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  </Route>
</Routes>
```

Note that index routes can't have children. If you're expecting that behavior, you probably want a [layout route](#layout-routes).

## Route Prefixes

A `<Route path>` _without_ an `element` prop adds a path prefix to its child routes, without introducing a parent layout.

```tsx filename=app/routes.ts lines=[1]
<Route path="projects">
  <Route index element={<ProjectsHome />} />
  <Route element={<ProjectsLayout />}>
    <Route path=":pid" element={<Project />} />
    <Route path=":pid/edit" element={<EditProject />} />
  </Route>
</Route>
```

## Dynamic Segments

If a path segment starts with `:` then it becomes a "dynamic segment". When the route matches the URL, the dynamic segment will be parsed from the URL and provided as `params` to other router APIs like `useParams`.

```tsx
<Route path="teams/:teamId" element={<Team />} />
```

```tsx filename=app/team.tsx
import { useParams } from "react-router";

export default function Team() {
  let params = useParams();
  // params.teamId
}
```

You can have multiple dynamic segments in one route path:

```tsx
<Route
  path="/c/:categoryId/p/:productId"
  element={<Product />}
/>
```

```tsx filename=app/category-product.tsx
import { useParams } from "react-router";

export default function CategoryProduct() {
  let { categoryId, productId } = useParams();
  // ...
}
```

You should ensure that all dynamic segments in a given path are unique. Otherwise, as the `params` object is populated - latter dynamic segment values will override earlier values.

## Optional Segments

You can make a route segment optional by adding a `?` to the end of the segment.

```tsx
<Route path=":lang?/categories" element={<Categories />} />
```

You can have optional static segments, too:

```tsx
<Route path="users/:userId/edit?" element={<User />} />
```

## Splats

Also known as "catchall" and "star" segments. If a route path pattern ends with `/*` then it will match any characters following the `/`, including other `/` characters.

```tsx
<Route path="files/*" element={<File />} />
```

```tsx
let params = useParams();
// params["*"] will contain the remaining URL after files/
let filePath = params["*"];
```

You can destructure the `*`, you just have to assign it a new name. A common name is `splat`:

```tsx
let { "*": splat } = useParams();
```

## Linking

Link to routes from your UI with `Link` and `NavLink`

```tsx
import { NavLink, Link } from "react-router";

function Header() {
  return (
    <nav>
      {/* NavLink makes it easy to show active states */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        Home
      </NavLink>

      <Link to="/concerts/salt-lake-city">Concerts</Link>
    </nav>
  );
}
```

---

Next: [Navigating](./navigating)


---
title: Navigating
order: 3
---

# Navigating

[MODES: declarative]

## Introduction

Users navigate your application with `<Link>`, `<NavLink>`, and `useNavigate`.

## NavLink

This component is for navigation links that need to render an active state.

```tsx
import { NavLink } from "react-router";

export function MyAppNav() {
  return (
    <nav>
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/trending" end>
        Trending Concerts
      </NavLink>
      <NavLink to="/concerts">All Concerts</NavLink>
      <NavLink to="/account">Account</NavLink>
    </nav>
  );
}
```

Whenever a `NavLink` is active, it will automatically have an `.active` class name for easy styling with CSS:

```css
a.active {
  color: red;
}
```

It also has callback props on `className`, `style`, and `children` with the active state for inline styling or conditional rendering:

```tsx
// className
<NavLink
  to="/messages"
  className={({ isActive }) =>
    isActive ? "text-red-500" : "text-black"
  }
>
  Messages
</NavLink>
```

```tsx
// style
<NavLink
  to="/messages"
  style={({ isActive }) => ({
    color: isActive ? "red" : "black",
  })}
>
  Messages
</NavLink>
```

```tsx
// children
<NavLink to="/message">
  {({ isActive }) => (
    <span className={isActive ? "active" : ""}>
      {isActive ? "👉" : ""} Tasks
    </span>
  )}
</NavLink>
```

## Link

Use `<Link>` when the link doesn't need active styling:

```tsx
import { Link } from "react-router";

export function LoggedOutMessage() {
  return (
    <p>
      You've been logged out.{" "}
      <Link to="/login">Login again</Link>
    </p>
  );
}
```

## useNavigate

This hook allows the programmer to navigate the user to a new page without the user interacting.

For normal navigation, it's best to use `Link` or `NavLink`. They provide a better default user experience like keyboard events, accessibility labeling, "open in new window", right click context menus, etc.

Reserve usage of `useNavigate` to situations where the user is _not_ interacting but you need to navigate, for example:

- After a form submission completes
- Logging them out after inactivity
- Timed UIs like quizzes, etc.

```tsx
import { useNavigate } from "react-router";

export function LoginPage() {
  let navigate = useNavigate();

  return (
    <>
      <MyHeader />
      <MyLoginForm
        onSuccess={() => {
          navigate("/dashboard");
        }}
      />
      <MyFooter />
    </>
  );
}
```

---

Next: [Url values](./url-values)

---
title: URL Values
---

# URL Values

[MODES: declarative]

## Route Params

Route params are the parsed values from a dynamic segment.

```tsx
<Route path="/concerts/:city" element={<City />} />
```

In this case, `:city` is the dynamic segment. The parsed value for that city will be available from `useParams`

```tsx
import { useParams } from "react-router";

function City() {
  let { city } = useParams();
  let data = useFakeDataLibrary(`/api/v2/cities/${city}`);
  // ...
}
```

## URL Search Params

Search params are the values after a `?` in the URL. They are accessible from `useSearchParams`, which returns an instance of [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

```tsx
function SearchResults() {
  let [searchParams] = useSearchParams();
  return (
    <div>
      <p>
        You searched for <i>{searchParams.get("q")}</i>
      </p>
      <FakeSearchResults />
    </div>
  );
}
```

## Location Object

React Router creates a custom `location` object with some useful information on it accessible with `useLocation`.

```tsx
function useAnalytics() {
  let location = useLocation();
  useEffect(() => {
    sendFakeAnalytics(location.pathname);
  }, [location]);
}

function useScrollRestoration() {
  let location = useLocation();
  useEffect(() => {
    fakeRestoreScroll(location.key);
  }, [location]);
}
```