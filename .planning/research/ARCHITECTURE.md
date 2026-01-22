# Architecture Research

**Domain:** Client-side validation tool (payment configuration validator)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Input   │  │  Display │  │  Error   │  │  Help    │    │
│  │  Form    │  │  Results │  │  Panel   │  │  Docs    │    │
│  └────┬─────┘  └────▲─────┘  └────▲─────┘  └──────────┘    │
│       │             │             │                          │
├───────┼─────────────┼─────────────┼──────────────────────────┤
│       │             │             │                          │
│       ▼             │             │                          │
│  ┌────────────────────────────────────────────────────┐      │
│  │              ORCHESTRATION LAYER                   │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │      │
│  │  │  Input   │→ │  Parser  │→ │Validator │         │      │
│  │  │ Handler  │  │          │  │  Engine  │         │      │
│  │  └──────────┘  └──────────┘  └─────┬────┘         │      │
│  └──────────────────────────────────────┼─────────────┘      │
│                                         │                    │
├─────────────────────────────────────────┼────────────────────┤
│                    VALIDATION LAYER     ▼                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Required │  │  Chain   │  │ Address  │  │  Asset   │    │
│  │  Fields  │  │ Specific │  │  Format  │  │  Rules   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    UTILITY LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │   Proxy Client       │  │   Format Helpers     │         │
│  │   (fetch wrapper)    │  │   (chain utils)      │         │
│  └──────────────────────┘  └──────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Input Form | Accept URL or JSON input, provide mode toggle | HTML form with textarea and URL input |
| Display Results | Show validation results with pass/fail/warnings | Templated HTML with conditional classes |
| Error Panel | Display user-friendly validation error messages | Expandable list with error details |
| Input Handler | Route URL requests to proxy, parse direct JSON | Async function that detects input type |
| Parser | Extract x402 config from X-Payment header or body | JSON parsing with error handling |
| Validator Engine | Coordinate validation rules, aggregate results | Rule runner with result collector |
| Required Fields | Check for mandatory fields (x402Version, payments) | Simple property existence checks |
| Chain Specific | Validate chain-dependent rules (EVM, Solana) | Switch-based validation by chain type |
| Address Format | Validate blockchain addresses per chain | Regex/length checks per chain spec |
| Asset Rules | Verify valid assets for each chain | Allowlist lookup per chain |
| Proxy Client | Fetch URLs via Cloudflare Worker, return 402 response | Fetch wrapper with error handling |
| Format Helpers | Provide chain-specific utility functions | Pure functions for address/asset validation |

## Recommended Project Structure

```
x402check/
├── index.html              # Single-page application entry point
├── styles/
│   └── main.css           # Component styles, validation result styles
├── js/
│   ├── main.js            # App initialization, event wiring
│   ├── input/
│   │   ├── handler.js     # Input routing (URL vs JSON)
│   │   └── parser.js      # Extract x402 config from response/JSON
│   ├── validation/
│   │   ├── engine.js      # Validation orchestration
│   │   ├── rules/
│   │   │   ├── required.js    # Required field validation
│   │   │   ├── chain.js       # Chain-specific validation
│   │   │   ├── address.js     # Address format validation
│   │   │   └── asset.js       # Asset validation per chain
│   │   └── result.js      # Result aggregation and formatting
│   ├── display/
│   │   ├── results.js     # Render validation results
│   │   └── errors.js      # Format and display errors
│   ├── utils/
│   │   ├── proxy.js       # Cloudflare Worker fetch wrapper
│   │   └── chains.js      # Chain-specific helpers (address, asset)
│   └── config/
│       └── chains.json    # Chain configurations (asset lists, patterns)
├── worker/
│   └── proxy.js           # Cloudflare Worker for CORS proxy
└── README.md
```

### Structure Rationale

- **Single HTML file:** Simple tools should have minimal entry points. All UI in one file reduces cognitive load.
- **Feature-based JS organization:** Group by feature (input, validation, display) not by type (models, views, controllers). This matches how developers think about the tool's flow.
- **Validation rules as modules:** Each rule is independent, making them easy to test, add, or remove without affecting others.
- **Flat module structure:** No deep nesting. In vanilla JS projects, imports are manual, so flat structures are easier to navigate.
- **Config as JSON:** Chain-specific data (asset lists, address patterns) belongs in data files, not code. Makes updates easier.
- **Worker separate:** Cloudflare Worker is deployed independently, so it lives in its own directory.

## Architectural Patterns

### Pattern 1: Unidirectional Data Flow

**What:** Input flows forward through parsing → validation → display. No component modifies upstream state.

**When to use:** When building tools where the process is linear and irreversible (validation results don't affect input).

**Trade-offs:**
- PRO: Easy to reason about, no circular dependencies, simple debugging
- PRO: Each stage is independently testable
- CON: May require passing data through intermediate layers
- CON: Cannot easily re-validate on config changes without restarting flow

**Example:**
```javascript
// main.js - orchestrate the flow
async function validateInput(input) {
  const config = await parseInput(input);      // Stage 1: Parse
  const results = await validateConfig(config); // Stage 2: Validate
  displayResults(results);                      // Stage 3: Display
}

// Each stage is pure (input → output)
```

### Pattern 2: Rule Registry Pattern

**What:** Validation rules register themselves with a central engine. Engine runs all rules and aggregates results.

**When to use:** When you have multiple independent validation rules that need to run on the same data.

**Trade-offs:**
- PRO: Easy to add new rules without modifying engine
- PRO: Rules can be selectively enabled/disabled
- PRO: Parallel execution possible
- CON: Overkill for < 10 rules
- CON: Rules can't depend on each other's results

**Example:**
```javascript
// validation/engine.js
class ValidationEngine {
  constructor() {
    this.rules = [];
  }

  registerRule(rule) {
    this.rules.push(rule);
  }

  async validate(config) {
    const results = await Promise.all(
      this.rules.map(rule => rule.validate(config))
    );
    return this.aggregateResults(results);
  }
}

// validation/rules/required.js
export const requiredFieldsRule = {
  name: 'required-fields',
  validate(config) {
    const errors = [];
    if (!config.x402Version) errors.push('Missing x402Version');
    if (!config.payments) errors.push('Missing payments array');
    return { errors, warnings: [] };
  }
};

// Register rules at startup
engine.registerRule(requiredFieldsRule);
engine.registerRule(chainSpecificRule);
```

### Pattern 3: Chain of Responsibility (Validation Rules)

**What:** Validation rules process config sequentially. If a rule fails critically, chain stops.

**When to use:** When validation order matters (e.g., must parse before validating structure, must check required fields before checking formats).

**Trade-offs:**
- PRO: Early exit on critical failures (no point validating addresses if payments array is missing)
- PRO: Clear ordering of validation logic
- CON: Sequential execution (slower than parallel)
- CON: Rules must be aware of their criticality level

**Example:**
```javascript
// validation/engine.js
async function validateWithChain(config) {
  const criticalRules = [requiredFieldsRule, structureRule];
  const standardRules = [addressRule, assetRule, chainRule];

  // Critical rules must pass
  for (const rule of criticalRules) {
    const result = await rule.validate(config);
    if (result.critical) {
      return { success: false, error: result };
    }
  }

  // Standard rules collect all errors
  const results = await Promise.all(
    standardRules.map(rule => rule.validate(config))
  );

  return aggregateResults(results);
}
```

### Pattern 4: Proxy Wrapper Pattern

**What:** Wrap Cloudflare Worker fetch in a client-side abstraction that handles errors, retries, and response parsing.

**When to use:** When external service calls need consistent error handling and response transformation.

**Trade-offs:**
- PRO: Centralized error handling
- PRO: Easy to mock for testing
- PRO: Can add retry logic, caching, or rate limiting in one place
- CON: Extra indirection layer

**Example:**
```javascript
// utils/proxy.js
export class ProxyClient {
  constructor(workerUrl) {
    this.workerUrl = workerUrl;
  }

  async fetch(url) {
    try {
      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new ProxyError(`Proxy returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new ProxyError(`Failed to fetch via proxy: ${error.message}`);
    }
  }
}

// Usage in input handler
const proxy = new ProxyClient('https://worker.example.com');
const response = await proxy.fetch(userUrl);
```

## Data Flow

### Request Flow (URL Input)

```
[User enters URL]
    ↓
[Input Handler detects URL]
    ↓
[Proxy Client sends to Cloudflare Worker]
    ↓
[Worker fetches URL, returns 402 response]
    ↓
[Parser extracts X-Payment header or body]
    ↓
[Parser converts to x402 config object]
    ↓
[Validation Engine runs all rules]
    ↓
[Display Results renders pass/fail/warnings]
```

### Request Flow (Direct JSON Input)

```
[User pastes JSON]
    ↓
[Input Handler detects JSON]
    ↓
[Parser validates and parses JSON]
    ↓
[Parser converts to x402 config object]
    ↓
[Validation Engine runs all rules]
    ↓
[Display Results renders pass/fail/warnings]
```

### Validation Flow (Internal)

```
[Config Object]
    ↓
[Validation Engine]
    ↓
    ├→ [Required Fields Rule] → (check x402Version, payments)
    ├→ [Structure Rule] → (check payments is array, has items)
    ├→ [Chain Rule] → (validate chain values: ethereum, solana, etc.)
    ├→ [Address Rule] → (validate address format per chain)
    └→ [Asset Rule] → (validate asset exists for chain)
    ↓
[Aggregate Results]
    ↓
    ├→ Critical errors? → [Display: Config Invalid]
    ├→ Errors? → [Display: Config Has Errors]
    ├→ Warnings only? → [Display: Config Valid with Warnings]
    └→ No issues? → [Display: Config Valid]
```

### Key Data Flows

1. **URL → Config:** Input handler → proxy client → worker → parser → config object
2. **JSON → Config:** Input handler → parser → config object
3. **Config → Results:** Config object → validation engine → rules (parallel) → result aggregator → display
4. **Error → User:** Any stage → error formatter → error panel display

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10k validations/day | Current architecture sufficient. Single static page, client-side validation, minimal server load on Cloudflare Worker. |
| 10k-100k validations/day | Add caching layer in Cloudflare Worker for repeated URL validations. Consider CDN for static assets. Monitor Worker execution time. |
| 100k+ validations/day | Consider rate limiting on Worker. Add validation result caching (client-side localStorage for repeat validations). May need Worker analytics to identify abuse patterns. |

### Scaling Priorities

1. **First bottleneck:** Cloudflare Worker rate limits. Fix: Cache 402 responses in Worker KV store with short TTL (5-15 minutes). Most validation tools are used repeatedly during development.
2. **Second bottleneck:** Repeated validation of same config. Fix: Client-side memoization of validation results keyed by config hash. If user validates same JSON twice, return cached result immediately.
3. **Non-bottleneck:** Validation performance. Rules are simple property checks and regex matches. Even 100 rules run in < 10ms client-side. Don't optimize prematurely.

## Anti-Patterns

### Anti-Pattern 1: Framework Dependency for Simple Tools

**What people do:** Reach for React/Vue/Svelte for every web project, including simple validation tools.

**Why it's wrong:**
- Adds build complexity (bundler, transpiler, node_modules)
- Increases page weight (framework runtime: 40-100kb gzipped)
- Creates maintenance burden (framework updates, security patches)
- Overkill for tools with minimal interactivity

**Do this instead:** Use vanilla JS with ES modules. For x402check, the entire UI is:
- One form (URL or JSON input)
- One results panel (templated HTML)
- One error list (map validation errors to DOM)

Modern browser APIs (fetch, template literals, classList) handle this elegantly without frameworks.

### Anti-Pattern 2: Server-Side Validation for Client-Only Data

**What people do:** Send user input to server for validation, then return results to client.

**Why it's wrong:**
- Unnecessary latency (round trip time)
- Server costs for pure computation
- Privacy concerns (user data leaves browser)
- Requires server infrastructure for static tool

**Do this instead:** Validate entirely client-side. For x402check:
- All validation rules run in browser
- No user data sent to server except URLs (which must be fetched)
- Tool works offline after initial load
- Can be hosted on static hosting (GitHub Pages, Cloudflare Pages)

### Anti-Pattern 3: Global State Mutations

**What people do:** Store config and validation results in global variables, mutate them from various functions.

```javascript
// BAD
let globalConfig = {};
let globalResults = {};

function parseInput(input) {
  globalConfig = JSON.parse(input);
}

function validate() {
  globalResults = runValidation(globalConfig);
}

function display() {
  showResults(globalResults);
}
```

**Why it's wrong:**
- Hard to test (functions depend on global state)
- Race conditions (async operations mutating same global)
- Unclear data flow (who mutates what when?)
- Difficult to add "compare two configs" feature later

**Do this instead:** Pass data explicitly through function parameters. Return new values.

```javascript
// GOOD
async function validateInput(input) {
  const config = parseInput(input);           // Returns new object
  const results = await validate(config);      // Returns new object
  display(results);                            // Pure display
}
```

### Anti-Pattern 4: Mixing Validation Logic with Display Logic

**What people do:** Validation rules directly manipulate DOM to show errors.

```javascript
// BAD
function validateAddress(address) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    document.getElementById('error').innerText = 'Invalid address';
    return false;
  }
  return true;
}
```

**Why it's wrong:**
- Validation rules can't be reused (tied to specific DOM structure)
- Difficult to test (requires DOM)
- Can't validate without displaying
- Hard to change error display format

**Do this instead:** Validation returns data, display consumes data.

```javascript
// GOOD - Validation
function validateAddress(address, chain) {
  const pattern = chain === 'ethereum' ? /^0x[a-fA-F0-9]{40}$/ : /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!pattern.test(address)) {
    return { valid: false, error: `Invalid ${chain} address format` };
  }
  return { valid: true };
}

// GOOD - Display
function displayErrors(errors) {
  const errorPanel = document.getElementById('error');
  errorPanel.innerHTML = errors.map(e => `<li>${e}</li>`).join('');
}
```

### Anti-Pattern 5: Over-Engineering Validation Rules

**What people do:** Create complex validation DSL, schema language, or rule builder for < 20 rules.

**Why it's wrong:**
- YAGNI: You don't need a rule engine for 10 validation checks
- Increases complexity: New syntax to learn
- Harder to debug: Errors in meta-layer
- Slower: Interpretation overhead

**Do this instead:** Write simple functions. For x402check, validation rules are:
1. Check x402Version === 1
2. Check payments is non-empty array
3. For each payment: check chain, address, asset, minAmount
4. Validate address format per chain
5. Validate asset exists for chain

This is 5 functions, each < 20 lines. No abstraction needed.

```javascript
// Simple and clear
function validateRequiredFields(config) {
  const errors = [];
  if (config.x402Version !== 1) errors.push('x402Version must be 1');
  if (!Array.isArray(config.payments) || config.payments.length === 0) {
    errors.push('payments must be a non-empty array');
  }
  return errors;
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Cloudflare Worker (Proxy) | POST request with URL in body, expect 402 response JSON | Must handle CORS, Worker has 50ms CPU time limit |
| User's 402 Endpoint | Fetched by Worker, not directly by client | Avoids CORS issues, isolates client from arbitrary endpoints |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Input → Parser | Direct function call with raw input string | Synchronous for JSON, async for URL (needs proxy) |
| Parser → Validator | Direct function call with config object | Synchronous, parser output is validator input |
| Validator → Display | Direct function call with results object | Synchronous, validator output is display input |
| Utils → All | Import as ES modules, call as pure functions | No state in utils, just helpers |

### Component Dependencies (Build Order)

```
Phase 1: Foundation
├── utils/chains.js (no dependencies)
├── utils/proxy.js (no dependencies)
└── validation/result.js (no dependencies)

Phase 2: Core Logic
├── input/parser.js (depends on: utils/proxy)
├── validation/rules/*.js (depends on: utils/chains)
└── validation/engine.js (depends on: rules/*, result.js)

Phase 3: UI
├── display/errors.js (depends on: validation/result)
├── display/results.js (depends on: display/errors)
└── input/handler.js (depends on: parser, utils/proxy)

Phase 4: Integration
└── main.js (depends on: handler, engine, display)
```

**Build order implications:**
- Start with utils (chain helpers, proxy wrapper) - no dependencies, easy to test
- Build validation rules next - depend only on utils, can be tested in isolation
- Build engine to orchestrate rules - rules must exist first
- Build display components - need result format defined
- Wire up main last - requires all other components

This matches the unidirectional data flow: utils → validation → display → orchestration.

## Sources

### Architecture Patterns
- [The Complete Guide to Frontend Architecture Patterns in 2026](https://dev.to/sizan_mahmud0_e7c3fd0cb68/the-complete-guide-to-frontend-architecture-patterns-in-2026-3ioo) - Component-based architecture trends
- [Web Application Architecture: The Latest Guide (2026 AI Update)](https://www.clickittech.com/software-development/web-application-architecture/) - Modern web app architecture
- [Patterns.dev](https://www.patterns.dev/) - Web development design patterns

### Vanilla JavaScript Structure
- [How I structure my vanilla JS projects | Go Make Things](https://gomakethings.com/how-i-structure-my-vanilla-js-projects/) - Practical vanilla JS organization
- [GitHub - google/pulito](https://github.com/google/pulito) - Google's vanilla JS conventions
- [Why Developers Are Ditching Frameworks for Vanilla JavaScript](https://thenewstack.io/why-developers-are-ditching-frameworks-for-vanilla-javascript/) - 2026 no-framework movement

### Validation Architecture
- [JSON Schema Validation: Advanced Patterns & Best Practices](https://jsonconsole.com/blog/json-schema-validation-advanced-patterns-best-practices-enterprise-applications) - Validation patterns
- [The Complete Guide to Data Validation Best Practices](https://www.pullchecklist.com/posts/data-validation-best-practices) - Validation best practices
- [Component Driven User Interfaces](https://www.componentdriven.org/) - Component architecture principles

---
*Architecture research for: x402check payment configuration validator*
*Researched: 2026-01-22*
