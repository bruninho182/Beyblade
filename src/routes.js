import { createBrowserRouter } from "react-router";
import Store from "./pages/Store/Store";

import App from "./App";

const router = createBrowserRouter([
  { path: "/", Component: App },
  { path: "/store", Component: Store },

]);

export default router;
