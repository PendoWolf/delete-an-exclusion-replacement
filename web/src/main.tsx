import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

let visitorId = localStorage.getItem('demo-visitor-id');
let accountId = localStorage.getItem('demo-account-id');
const isNewVisitor = !visitorId;
const isNewAccount = !accountId;

if (!visitorId) {
  visitorId = 'visitor-' + Math.random().toString(36).slice(2);
  localStorage.setItem('demo-visitor-id', visitorId);
}
if (!accountId) {
  accountId = 'account-' + Math.random().toString(36).slice(2);
  localStorage.setItem('demo-account-id', accountId);
}

pendo.initialize({
  visitor: {
    id: visitorId,
  },
  account: {
    id: accountId,
  },
  sessionReplay: { isActive: true },
});

// Pendo Track Event: first visit, when a new visitor ID was created and saved.
// The localStorage check makes this fire once per browser, not on every load.
if (isNewVisitor) {
  window.pendo?.track?.('Visitor identified', {
    is_new_account: isNewAccount,
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
