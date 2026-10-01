import React from "react";
import { createRoot } from "react-dom/client";
import LibverseApp from "./LibverseApp.jsx";
import "./index.css";
import "./App.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LibverseApp />
  </React.StrictMode>
);