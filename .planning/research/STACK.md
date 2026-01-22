# Stack Research

**Domain:** Developer validation tool (web-based)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vanilla JavaScript | ES2022+ | Client-side validation logic | Zero build step, maximum simplicity, native browser APIs now handle what jQuery/frameworks did. Modern JS has everything needed: fetch, DOM manipulation, modules. |
| HTML5 | Latest | Page structure | Semantic HTML provides built-in accessibility, form validation attributes. No framework overhead. |
| CSS (Classless) | N/A | Styling | Pico CSS or similar provides professional design with minimal markup, no JavaScript dependencies. |
| Cloudflare Workers | Latest | CORS proxy | Free tier (100k req/day), edge deployment, <1ms cold start. Official platform for simple proxies. |
| Wrangler CLI | 3.x | Worker deployment | Official Cloudflare CLI, handles auth, deployment, local dev. Node 16.17.0+ required. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | N/A | Validation logic | Custom validation is 50 lines of code for x402 rules. Libraries like Zod (10KB+) add unnecessary weight for 4 field types. |
| Pico CSS | 2.x (~10KB gzipped) | Styling (optional) | If you want professional UI without writing CSS. Classless = works on semantic HTML with zero class names. Drop-in via CDN. |
| Prettier | Latest | Code formatting (dev) | Standard formatter for HTML/CSS/JS. Run manually or via IDE. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Wrangler CLI | Cloudflare Worker dev/deploy | Install: `npm install -g wrangler`. Commands: `wrangler dev` (local), `wrangler deploy` (prod). |
| Live Server (VS Code) | Local HTML development | Zero-config static server. Reload on save. Alternative: `python3 -m http.server`. |
| Browser DevTools | Debugging | Chrome/Firefox have excellent debugging for vanilla JS. No source maps needed. |
| Vitest | Unit testing (optional) | If you want to test validation logic. Faster than Jest, native ESM. Setup: `npm install -D vitest`. |

## Installation

```bash
# Cloudflare Worker tooling
npm install -g wrangler

# Project dev dependencies (optional, for testing)
npm init -y
npm install -D vitest

# No runtime dependencies needed
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vanilla JS | React/Vue | If building multi-page app with complex state. Overkill for single-page validator. |
| Pico CSS | Tailwind CSS | If you need precise design control. Tailwind requires build step, adds complexity. |
| Cloudflare Workers | Vercel Edge Functions | If already on Vercel. Otherwise, Cloudflare has better free tier (100k vs 1k requests). |
| Cloudflare Workers | AWS Lambda | Never for CORS proxy. Lambda has cold starts (100-500ms), costs more, harder setup. |
| Custom validation | Zod/Yup | If validating 20+ field types. x402 has 9 fields, custom logic is simpler. |
| Vitest | Jest | Never for new projects. Vitest is 10-20x faster, native ESM, better TypeScript. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| jQuery | 2025 equivalent: `document.querySelector()`, `fetch()` do everything jQuery did. 30KB library for features now built into browsers. | Vanilla JS with modern APIs |
| Webpack/Vite | No build step needed for plain HTML/JS. Adds complexity, dev dependencies, config files. | Direct `<script>` tags or ES modules via `type="module"` |
| TypeScript | Requires build step, contradicts "maximum simplicity" constraint. Runtime errors are fine for 200-line tool. | Vanilla JS with JSDoc comments for IDE hints |
| Bootstrap | 25KB CSS + 50KB JS. Requires jQuery (deprecated). Too heavy for simple validator. | Pico CSS (10KB, zero JS) or custom CSS |
| Moment.js | Deprecated, 67KB. For date parsing in future features. | Native `Date` API or `date-fns` (modular, 2-5KB per function) |

## Stack Patterns by Variant

**If validation logic gets complex (>500 lines):**
- Split into ES modules: `validator.js`, `chain-utils.js`, `ui.js`
- Import via `<script type="module" src="validator.js">`
- Enables testing individual modules with Vitest
- Still no build step

**If you need TypeScript later:**
- Use JSDoc comments for type hints: `/** @param {string} address */`
- VS Code provides IntelliSense without build step
- Only add TypeScript + build if codebase exceeds 1000 lines

**If deploying to non-Cloudflare environment:**
- Worker code is portable to Vercel Edge, Deno Deploy, Netlify Edge
- Uses Web Standard APIs (Request/Response), not Node.js
- May need minor syntax changes for non-Cloudflare platforms

## Cloudflare Worker Setup

### File Structure
```
/worker
  wrangler.toml       # Worker config (name, routes)
  index.js            # CORS proxy code
```

### Essential CORS Headers
```javascript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

### Worker Code (Complete Example)
```javascript
export default {
  async fetch(request) {
    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Extract target URL from query param
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing url parameter", { status: 400 });
    }

    // Fetch target URL
    const targetRequest = new Request(targetUrl, {
      method: request.method,
      headers: { "Origin": new URL(targetUrl).origin },
    });

    let response = await fetch(targetRequest);

    // Add CORS headers
    response = new Response(response.body, response);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.append("Vary", "Origin");

    return response;
  }
};
```

### Deployment
```bash
# Login to Cloudflare
wrangler login

# Deploy worker
cd worker
wrangler deploy

# Output: Worker URL like https://x402-proxy.your-subdomain.workers.dev
```

## Vanilla JS Project Structure

```
/
  index.html           # Main page
  /js
    validator.js       # Validation logic (can be ES module)
    ui.js              # DOM manipulation (optional split)
  /css
    styles.css         # Custom styles or empty if using Pico CSS
  /worker
    index.js           # Cloudflare Worker
    wrangler.toml      # Worker config
  /test
    validator.test.js  # Vitest tests (optional)
```

**File Organization Principles:**
- Keep JavaScript in `/js` directory for organization
- Use ES modules (`type="module"`) if splitting code
- Avoid classes unless modeling true entities (Payment, ValidationResult)
- Prefer pure functions for validation logic (easier to test)

## Testing Strategy

### Unit Tests (Optional)
```javascript
// test/validator.test.js
import { describe, it, expect } from 'vitest';
import { validateAddress } from '../js/validator.js';

describe('validateAddress', () => {
  it('accepts valid EVM address', () => {
    expect(validateAddress('0x1234...', 'base')).toBe(true);
  });
});
```

Run: `npx vitest` (watch mode) or `npx vitest run` (CI)

### Manual Testing
- Browser DevTools console for quick validation checks
- Live reload via Live Server for UI changes
- Test CORS proxy with curl: `curl "https://your-worker.workers.dev?url=https://example.com"`

### No E2E Tests Needed
- Single page, minimal interactions
- Browser testing (manual) covers edge cases faster than Playwright setup
- If adding E2E later, use Playwright (fastest, best API)

## Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| Node.js | 16.17.0+ | Required for Wrangler CLI |
| Wrangler | 3.x | Latest stable, uses Workers SDK |
| Vitest | 2.x | If using tests, requires Node 18+ |
| Pico CSS | 2.x | Stable, no breaking changes expected |

**Browser Support:**
- Modern browsers (Chrome/Firefox/Safari/Edge last 2 years)
- ES2022 features: `?.` optional chaining, `??` nullish coalescing
- No IE11 support needed (developer tool, not consumer product)

## Rationale: Why No Framework?

**From research:** Vanilla JS is making a comeback in 2025 for developer tools because:

1. **Native APIs are sufficient** - `querySelector`, `fetch`, `addEventListener` cover 90% of needs
2. **Zero build complexity** - No webpack, no transpilation, no node_modules, no package.json
3. **Faster development** - No framework mental model, no virtual DOM debugging, no dependency updates
4. **Better performance** - No framework overhead (React is 40KB minified), instant page load
5. **Easier debugging** - Browser DevTools show actual code, no source maps, no framework stack traces

**When frameworks make sense:** Multi-page apps, complex state management, team collaboration with framework expertise. None apply to x402check.

## Confidence Assessment

| Category | Confidence | Source |
|----------|------------|--------|
| Vanilla JS | HIGH | Official browser APIs, Web Standards, widespread 2025 adoption |
| Cloudflare Workers | HIGH | Official Cloudflare documentation, production-ready platform |
| Pico CSS | MEDIUM | GitHub stars (13k+), active maintenance, but not as battle-tested as Bootstrap |
| Vitest | HIGH | Vite ecosystem standard, 400% adoption increase 2023-2024 |
| No build step | HIGH | Project constraint, validated by research showing vanilla JS viability |

## Sources

**Vanilla JavaScript:**
- [How I structure my vanilla JS projects - Go Make Things](https://gomakethings.com/how-i-structure-my-vanilla-js-projects/)
- [Vanilla JavaScript Is Quietly Taking Over Again](https://medium.com/@arkhan.khansb/vanilla-javascript-is-quietly-taking-over-again-heres-why-developers-are-switching-back-5ee1588e2bfa)
- [Why Vanilla JavaScript Is Making a Comeback in 2025](https://devtechinsights.com/vanilla-javascript-comeback-2025/)

**Cloudflare Workers:**
- [CORS header proxy - Cloudflare Workers docs](https://developers.cloudflare.com/workers/examples/cors-header-proxy/) (Official, verified)
- [Wrangler CLI Commands](https://developers.cloudflare.com/workers/wrangler/commands/) (Official)
- [Get started - Workers Guide](https://developers.cloudflare.com/workers/get-started/guide/) (Official)

**CSS Frameworks:**
- [Pico CSS - Minimal CSS Framework](https://picocss.com/) (Official)
- [Less is More: Minimal CSS Frameworks](https://pullflow.com/blog/minimal-css-classless-frameworks)
- [Top 6 CSS frameworks for 2025](https://blog.logrocket.com/top-6-css-frameworks-2025/)

**Testing:**
- [Vitest vs Jest 2025 Comparison](https://generalistprogrammer.com/comparisons/vitest-vs-jest) (Technical comparison)
- [Best JavaScript Testing Framework 2025](https://www.baserock.ai/blog/best-javascript-testing-framework)

**Micro Libraries:**
- [Vanilla List - The Vanilla JavaScript Repository](https://vanillalist.top/)
- [5 Underappreciated JavaScript Libraries 2025](https://thenewstack.io/5-underappreciated-javascript-libraries-to-try-in-2025/)

---
*Stack research for: x402check developer validation tool*
*Researched: 2026-01-22*
