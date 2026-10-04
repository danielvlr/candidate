import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ToastProvider } from "./components/ui/Toast.tsx";
import { installAuthFetch } from "./services/authFetch.ts";

// Precisa rodar antes de qualquer chamada à API: anexa o JWT e trata 401.
installAuthFetch();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
