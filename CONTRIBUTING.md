# Contributing to Graphon

Thank you for your interest in contributing to Graphon! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to maintain a welcoming and inclusive environment. Be respectful, constructive, and considerate in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/graphon.git
cd graphon

# Install dependencies
pnpm install

# Start the demo app (for visual testing)
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Project Structure

```
graphon/
├── packages/
│   ├── core/         # @graphon/core - graph model, renderer, layouts
│   ├── react/        # @graphon/react - React bindings
│   └── demo/         # Demo application
├── plan/             # Design documents and roadmap
└── apps/
    └── demo/         # Development playground
```

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make your changes** following the [coding standards](#coding-standards)

3. **Test your changes**:
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

4. **Commit your changes** using [conventional commits](#commit-convention)

5. **Push and create a Pull Request**

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning and changelog generation.

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description | Release |
|------|-------------|---------|
| `feat` | New feature | Minor |
| `fix` | Bug fix | Patch |
| `perf` | Performance improvement | Patch |
| `refactor` | Code refactoring | Patch |
| `docs` | Documentation | None |
| `style` | Code style (formatting) | None |
| `test` | Adding/updating tests | None |
| `chore` | Maintenance | None |
| `ci` | CI/CD changes | None |
| `build` | Build system changes | None |

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
feat!: change node style API

BREAKING CHANGE: nodeStyle prop renamed to nodeStyleFn
```

### Examples

```bash
# Feature
feat(renderer): add support for gradient fills

# Bug fix
fix(layout): prevent infinite loop in force simulation

# Performance
perf(physics): optimize quadtree construction

# Documentation
docs: update API reference for edge styling
```

---

## Pull Request Process

1. **Update documentation** if you're changing APIs
2. **Add tests** for new functionality
3. **Ensure all checks pass**:
   - TypeScript compilation
   - Linting
   - Tests
4. **Request review** from maintainers
5. **Address feedback** promptly

### PR Title

Use the same format as commits:
```
feat(renderer): add support for node images
```

---

## Coding Standards

### General Principles

- **Functions do one thing** — if you can describe it with "and", split it
- **Keep functions small** — under 40 lines, 65 max
- **No boolean flag parameters** — split into separate functions
- **Max 4 parameters** — use options object for more
- **Exit early** — use guard clauses, avoid deep nesting
- **Prefer iterators** — `map`, `filter`, `reduce` over `for` loops

### TypeScript

- All functions need **explicit return types**
- **No `any`** — use `unknown` and narrow
- Prefer `interface` for objects, `type` for unions
- Use `const` over `let`, never `var`

### React

- Functions returning JSX are **components** (use PascalCase)
- **Avoid prop drilling** — use Context or composition
- **Colocate state** as close to where it's used as possible

### File Organization

- Keep files **under 200 lines**
- One concept per file
- Co-locate tests next to source files

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode (in package directory)
cd packages/core && pnpm vitest
```

### Writing Tests

- **Test behavior**, not implementation
- One assertion concept per test
- Use descriptive names: `should [behavior] when [condition]`
- Follow Arrange-Act-Assert structure

```typescript
describe('ForceLayout', () => {
  it('should spread nodes apart when they overlap', () => {
    // Arrange
    const nodes = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 0, y: 0 },
    ];
    
    // Act
    const positions = layout.run(nodes, []);
    
    // Assert
    expect(distance(positions.a, positions.b)).toBeGreaterThan(0);
  });
});
```

---

## Documentation

### API Documentation

- Add JSDoc comments to all public APIs
- Include `@example` blocks for complex APIs
- Document parameters and return types

```typescript
/**
 * Computes force-directed layout positions for nodes.
 *
 * @param nodes - Array of nodes to position
 * @param edges - Array of edges defining connections
 * @param options - Layout configuration
 * @returns Map of node IDs to positions
 *
 * @example
 * ```typescript
 * const positions = forceLayout(nodes, edges, {
 *   iterations: 300,
 *   chargeStrength: -100,
 * });
 * ```
 */
export function forceLayout(
  nodes: Node[],
  edges: Edge[],
  options?: ForceLayoutOptions
): PositionMap {
  // ...
}
```

### README Updates

When adding features, update:
- Feature list in README
- API Reference section
- Examples if applicable

---

## Questions?

Feel free to:
- Open an issue for bugs or feature requests
- Start a discussion for questions
- Reach out to maintainers

Thank you for contributing! 🎉
