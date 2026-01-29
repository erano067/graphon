# Copilot Coding Guidelines

## Forbidden Commands

- **Never run `pnpm dev`** — The user manages the dev server themselves. Only run build, test, lint, and typecheck commands.

## Forbidden Practices

- **Never add backward compatibility code** — This is a greenfield project with no legacy users. No deprecated APIs, no `@deprecated` tags, no eslint-disable for deprecated warnings, no legacy fallbacks.

---

## Critical Self-Review

Before every change, ask yourself:

- **Have I thought through the design?** — Explore alternatives before coding. Present the tradeoffs. Don't jump to implementation.
- **Do we need it?** — If unsure, don't add it
- **Is there a simpler way?** — The best code is no code
- **What would a senior developer say?** — Would they approve this in code review?
- **Am I solving the right problem?** — Step back, verify the requirement
- **Will this be obvious to the next reader?** — If it needs explanation, simplify it
- **Am I adding complexity?** — Every line is a liability
- **Is this the right place for this code?** — Does it belong in this file/module?
- **Am I repeating myself?** — But also: is premature abstraction worse?
- **What's the blast radius?** — How many things break if this is wrong?
- **Can I delete this instead?** — Removing code > adding code
- **Have I verified it works?** — Build, test, and check for runtime errors before declaring done.

**Default to NO.** Add only what's necessary. Elegant code is minimal code.

---

## Core Principles

### Function Design
- Functions should do **one thing only** — if you can describe it with "and", split it
- Keep functions **small** (< 20 lines preferred, < 40 max, **65 hard limit**)
- Avoid **boolean flag parameters** — split into separate functions instead
- **Max 4 parameters** — use an options object for more
- **Negate conditions to exit early** — avoid deep nesting with guard clauses
- No Comments at all!! code should be self-explanatory
- Return early, fail fast — don't wrap entire function body in conditionals
- Pure functions over side effects when possible
- Name functions with verbs that describe what they do
- **Don't fight line limits with compression** — extract helper functions instead; Prettier will expand cramped code anyway

### File Organization
- Keep files **small** (< 200 lines)
- One concept per file — if a file does multiple things, split it
- Co-locate related code — tests next to source, types with implementations
- Index files for public exports only — no logic in index.ts

### Code Structure
- **Avoid nesting** — max 2-3 levels of indentation
- **Exit early** with guard clauses instead of nested if/else
- Use **iterators and JS idioms** — `map`, `filter`, `reduce`, `for...of`
- Avoid `for (let i = 0; ...)` when iterators work
- Prefer `const` over `let`, never use `var`
- Destructure objects and arrays at point of use

### React Specific
- **Functions returning JSX are components** — treat them as such (PascalCase, hooks rules apply)
- **Avoid prop drilling** — use Context, composition, or state management
- Keep components small and focused — extract sub-components early
- Prefer composition over configuration (children > render props > many props)
- Custom hooks for reusable logic — extract when used in 2+ places
- Colocate state as close to where it's used as possible
- Memoize expensive computations, not everything

### Architecture
- **Clear separation of concerns** — UI, logic, data, side effects in separate layers
- **Depend on abstractions** — interfaces over concrete implementations
- **Stable code must not depend on volatile code** — core shouldn't import features
- Keep side effects at the edges — pure logic in the middle
- Single source of truth for state
- Encapsulation over reuse — don't expose internals for convenience

### Naming
- Boolean variables: `isLoading`, `hasError`, `canSubmit`, `shouldRender`
- Event handlers: `onEventName` (props), `handleEventName` (implementation)
- Arrays: plural nouns (`users`, `items`, `nodeIds`)
- Functions: verb + noun (`getUser`, `calculateTotal`, `renderHeader`)
- Avoid abbreviations except common ones (`id`, `url`, `config`)

### Error Handling
- **Fail fast, fail loud** — throw errors early, don't swallow them
- Use specific error types over generic Error
- Handle errors at the appropriate level — not too early, not too late
- Provide actionable error messages

### Types (TypeScript)
- Prefer `interface` for object shapes, `type` for unions/intersections
- Avoid `any` — use `unknown` and narrow, or be explicit
- Export types alongside their implementations
- Use discriminated unions over optional properties for variants
- Readonly by default — mutate explicitly
- **Avoid nullable/optional fields** — prefer required fields with sensible defaults
- If a field can be absent, question if it belongs on this type at all
- **All functions need explicit return types** — including helper functions
- **Combine type and value imports** — use `import { Foo, type Bar } from 'mod'`
- **Optional properties with `exactOptionalPropertyTypes`** — never pass `undefined` directly:
  ```typescript
  // ❌ Type error with exactOptionalPropertyTypes
  fn({ optionalProp: maybeUndefined });
  
  // ✅ Spread pattern
  fn({ ...(maybeUndefined && { optionalProp: maybeUndefined }) });
  ```

### Testing
- Test behavior, not implementation
- One assertion concept per test (can have multiple expects)
- Descriptive test names: "should [expected behavior] when [condition]"
- Arrange-Act-Assert structure
- Mock at boundaries, not internals

### Performance
- Measure before optimizing — don't prematurely optimize
- Batch state updates
- Virtualize long lists
- Lazy load routes and heavy components
- Debounce/throttle expensive operations

---

## Anti-Patterns to Avoid

```typescript
// ❌ Boolean flag parameter
function fetchUser(id: string, withPosts: boolean) { ... }

// ✅ Separate functions
function fetchUser(id: string) { ... }
function fetchUserWithPosts(id: string) { ... }
```

```typescript
// ❌ Large parameter list
function createNode(id, x, y, color, size, label, visible, selected) { ... }

// ✅ Options object
function createNode(id: string, options: NodeOptions) { ... }
```

```typescript
// ❌ Deep nesting
function process(data) {
  if (data) {
    if (data.items) {
      if (data.items.length > 0) {
        // actual logic buried here
      }
    }
  }
}

// ✅ Early returns
function process(data) {
  if (!data?.items?.length) return;
  // actual logic at top level
}
```

```typescript
// ❌ Prop drilling
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserInfo user={user} />

// ✅ Context or composition
<UserProvider user={user}>
  <App>
    <Layout>
      <Sidebar>
        <UserInfo /> // uses useUser() hook
```

```typescript
// ❌ Function returning JSX treated as function
const renderHeader = () => <Header title={title} />;
return <div>{renderHeader()}</div>;

// ✅ Extract as component
const HeaderSection = () => <Header title={title} />;
return <div><HeaderSection /></div>;
```

```typescript
// ❌ Imperative loops
const results = [];
for (let i = 0; i < items.length; i++) {
  if (items[i].active) {
    results.push(items[i].name);
  }
}

// ✅ Declarative with iterators
const results = items
  .filter(item => item.active)
  .map(item => item.name);
```

---

## Quick Checklist

Before submitting code, verify:

- [ ] Functions are small and do one thing
- [ ] No boolean flag parameters
- [ ] No deep nesting (max 2-3 levels)
- [ ] Early returns for guard conditions
- [ ] Files under 200 lines
- [ ] No prop drilling (use context/composition)
- [ ] JSX-returning functions are proper components
- [ ] Using iterators over imperative loops
- [ ] Clear separation of concerns
- [ ] Types are explicit, no `any`
