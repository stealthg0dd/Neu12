import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force dark theme
document.documentElement.classList.add("dark");
document.documentElement.setAttribute("data-theme", "dark");
document.body.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
