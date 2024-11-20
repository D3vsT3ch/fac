import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { SmartAccountProvider } from "./context/SmartAccountContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SmartAccountProvider>
        <App />
      </SmartAccountProvider>
    </BrowserRouter>
  </React.StrictMode>
);
