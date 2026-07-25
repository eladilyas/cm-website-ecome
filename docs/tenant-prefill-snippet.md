# Demo tenant — one-click sign-in listener

The marketing site's live-POS embed (`/demo` and the home landing preview)
sends the demo credentials via `postMessage` when a visitor clicks
**Sign in with demo account**. The tenant only needs to listen for that
message, fill the login form, and submit it.

Add this once to the tenant's login page (POS and Back-office):

```html
<script>
  (function () {
    var ALLOWED_ORIGINS = [
      "https://caisse-manager.ma",
      "https://www.caisse-manager.ma",
      "http://46.202.171.97:3100",
    ];

    window.addEventListener("message", function (event) {
      if (ALLOWED_ORIGINS.indexOf(event.origin) === -1) return;
      var data = event.data || {};
      if (data.type !== "cm:demo:prefill") return;
      var creds = data.credentials || {};

      // Match field names to your login form. Adjust selectors below if
      // your inputs are named differently.
      var fieldMap = {
        user: 'input[name="user"], input[name="username"], input[id="user"]',
        pin: 'input[name="pin"], input[type="password"][maxlength]',
        email: 'input[type="email"], input[name="email"]',
        password: 'input[type="password"][name="password"], input[name="password"]',
      };

      Object.keys(creds).forEach(function (key) {
        var sel = fieldMap[key];
        if (!sel) return;
        var el = document.querySelector(sel);
        if (!el) return;
        var setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        setter.call(el, creds[key]);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });

      var form = document.querySelector("form");
      if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
    });
  })();
</script>
```

The listener validates `event.origin` against a whitelist so no other
site can trigger auto-login. Add production origins as they come online
(custom domain + Cloudflare Tunnel etc.).

Message shape sent by the marketing site:

```json
{
  "type": "cm:demo:prefill",
  "surface": "pos" | "backoffice",
  "credentials": {
    "user": "test",
    "pin": "0000"
    // or:
    // "email": "root@cm.com",
    // "password": "Caisse@Manager"
  }
}
```

Adjust the CSS selectors in `fieldMap` to match the tenant's actual
input names. Once the snippet is deployed on the tenant, the visitor's
click on **Sign in with demo account** in the marketing embed will
auto-fill and submit the login form immediately.
