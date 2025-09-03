import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force dark theme immediately
document.documentElement.classList.add("dark");
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.style.backgroundColor = "hsl(240, 10%, 8%)";
document.documentElement.style.color = "hsl(0, 0%, 100%)";

// Apply to body as well
document.body.classList.add("dark");
document.body.style.backgroundColor = "hsl(240, 10%, 8%)";
document.body.style.color = "hsl(0, 0%, 100%)";

// Ensure it stays dark even after React renders
const observer = new MutationObserver(() => {
  if (!document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.add("dark");
    document.documentElement.style.backgroundColor = "hsl(240, 10%, 8%)";
  }
  if (!document.body.classList.contains("dark")) {
    document.body.classList.add("dark");
    document.body.style.backgroundColor = "hsl(240, 10%, 8%)";
  }
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class", "style"]
});

createRoot(document.getElementById("root")!).render(<App />);
