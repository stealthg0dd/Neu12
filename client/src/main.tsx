import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Immediately force dark theme with aggressive styling
function forceDarkTheme() {
  document.documentElement.classList.add("dark");
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.style.setProperty("background-color", "hsl(240, 10%, 8%)", "important");
  document.documentElement.style.setProperty("color", "hsl(0, 0%, 100%)", "important");
  
  document.body.classList.add("dark");
  document.body.style.setProperty("background-color", "hsl(240, 10%, 8%)", "important");
  document.body.style.setProperty("color", "hsl(0, 0%, 100%)", "important");
  
  const root = document.getElementById("root");
  if (root) {
    root.style.setProperty("background-color", "hsl(240, 10%, 8%)", "important");
    root.style.setProperty("color", "hsl(0, 0%, 100%)", "important");
    root.style.setProperty("min-height", "100vh", "important");
  }
}

// Apply immediately
forceDarkTheme();

// Keep applying it continuously
setInterval(forceDarkTheme, 100);

// Also use mutation observer
const observer = new MutationObserver(forceDarkTheme);
observer.observe(document.documentElement, {
  attributes: true,
  childList: true,
  subtree: true
});

createRoot(document.getElementById("root")!).render(<App />);
