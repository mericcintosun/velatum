# Security notes

Velatum reads GPX files inside your browser tab and measures how well your privacy settings hide your home. It has no backend that accepts input, no account and no store.

## Contract addresses and chain id

None. Velatum has no contract, no chain and no wallet.

## Wallet permissions requested

None. Velatum never asks to connect a wallet and never asks for a signature.

The browser permissions the site denies, from the `Permissions-Policy` header in `next.config.ts`:

```ts
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
```

So the page cannot read your location, camera or microphone, even if a script asked.

## Approvals and spenders

None. There is nothing to approve and nothing that can spend.

What the page can send and where: nothing leaves the tab. Uploaded files are parsed with the browser's DOMParser and measured in a Web Worker on your device. The production Content-Security-Policy sets `connect-src 'self'`, so the browser blocks any request to another origin. These are the directives as they stand in `next.config.ts` (the `'unsafe-eval'` and `ws: wss:` additions apply only outside production):

```ts
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
```

Known finding, severity low: `script-src` allows `'unsafe-inline'` for the inline bootstrap scripts Next.js writes. No user-supplied HTML is rendered, and `connect-src 'self'` still blocks sending data out. The planned fix is a per-request nonce in `script-src`.

## Source

https://github.com/mericcintosun/velatum

To report an issue, open a GitHub issue on that repository. Never include real GPS tracks or a real address in a report; describe the problem with the synthetic sample runners instead.
