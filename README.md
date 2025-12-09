# True Myth Web Components

A functional programming library implemented as web components, bringing type-safe error handling, optional values, and asynchronous operations to the DOM.

## Overview

True Myth provides functional programming constructs as first-class web components, allowing you to build more robust, predictable UIs by making impossible states impossible and eliminating null/undefined errors at the component level.

## Installation

```bash
npm install v-selector
```

Or include directly in HTML:

```html
<script type="module">
  import 'https://unpkg.com/v-selector/dist/true-myth.js';
  import 'https://unpkg.com/v-selector/dist/instance-provider.js';
</script>
```

## Core Concepts

### 1. Result: Success or Failure

The `Result` type represents computations that can succeed (`Ok`) or fail (`Error`).

```html
<!-- Creating Results -->
<true-myth-result value="success" is-ok></true-myth-result>
<true-myth-error value="error message"></true-myth-error>
<true-myth-ok value="success value"></true-myth-ok>

<!-- Using Results in JavaScript -->
<script>
  const result = document.querySelector('true-myth-result');
  
  // Safely extract values
  const value = result.unwrap(); // throws if error
  const safeValue = result.unwrapOr('default'); // returns default if error
  
  // Transform values
  const upper = result.map(v => v.toUpperCase());
  const chained = result.andThen(v => {
    const next = document.createElement('true-myth-result');
    next.value = v + ' processed';
    next.isOk = true;
    return next;
  });
</script>
```

### 2. Maybe: Optional Values

The `Maybe` type represents values that might be present (`Just`) or absent (`Nothing`).

```html
<!-- Creating Maybes -->
<true-myth-maybe value="present value" is-just></true-myth-maybe>
<true-myth-maybe is-nothing></true-myth-maybe>

<!-- Using Maybes -->
<script>
  const maybe = document.querySelector('true-myth-maybe');
  
  // Extract with safety
  const value = maybe.unwrap(); // throws if nothing
  const safeValue = maybe.unwrapOr('default');
  
  // Chain operations
  const processed = maybe
    .map(v => v.toUpperCase())
    .andThen(v => {
      const next = document.createElement('true-myth-maybe');
      next.value = v + '!';
      next.isJust = true;
      return next;
    });
</script>
```

### 3. Task: Asynchronous Operations

The `Task` type represents asynchronous computations that can be pending, completed, or failed.

```html
<!-- Creating Tasks -->
<true-myth-task value="initial"></true-myth-task>

<!-- Using Tasks -->
<script>
  const task = document.querySelector('true-myth-task');
  
  // Run the task
  task.run().then(result => {
    console.log('Task completed:', result.value);
  });
  
  // Resolve or reject from elsewhere
  task.resolve('final value');
  // or
  task.reject('error occurred');
</script>
```

### 4. InstanceProvider: Dependency Injection

The `InstanceProvider` component registers itself with a DOM-wide dependency injection container and can create instances of other components.

```html
<!-- Register providers -->
<instance-provider component-type="result" value="default"></instance-provider>
<instance-provider component-type="task"></instance-provider>
<instance-provider component-type="maybe"></instance-provider>

<!-- Use the container -->
<script>
  async function useContainer() {
    const container = await getOrCreateDOMContainer();
    const resultProvider = container.get('result');
    
    if (resultProvider) {
      // Get provider info
      const info = resultProvider.get();
      console.log('Provider:', info);
      
      // Create new instance
      const newResult = resultProvider.createInstance('custom value');
      document.body.appendChild(newResult);
    }
  }
</script>
```

## API Reference

### TrueMythResult

#### Attributes
- `value` (string): The result value
- `is-ok` (boolean): Whether this is a success result
- `is-error` (boolean): Whether this is an error result

#### Methods
- `unwrap(): string` - Returns value if ok, throws if error
- `unwrapOr(defaultValue: string): string` - Returns value if ok, defaultValue if error
- `unwrapErr(): string` - Returns error value if error, throws if ok
- `map(fn: (value: string) => string): TrueMythResult` - Transforms ok value, passes through errors
- `mapErr(fn: (error: string) => string): TrueMythResult` - Transforms error value, passes through ok
- `andThen(fn: (value: string) => TrueMythResult): TrueMythResult` - Chains operations on ok values
- `orElse(fn: (error: string) => TrueMythResult): TrueMythResult` - Chains operations on error values

#### Events
- `result-created` - Emitted when component is connected

### TrueMythOk / TrueMythError

Specialized versions of `TrueMythResult` that automatically set their success/failure state.

### TrueMythMaybe

#### Attributes
- `value` (string): The maybe value
- `is-just` (boolean): Whether a value is present
- `is-nothing` (boolean): Whether no value is present

#### Methods
- `unwrap(): string` - Returns value if just, throws if nothing
- `unwrapOr(defaultValue: string): string` - Returns value if just, defaultValue if nothing
- `map(fn: (value: string) => string): TrueMythMaybe` - Transforms just value, passes through nothing
- `andThen(fn: (value: string) => TrueMythMaybe): TrueMythMaybe` - Chains operations on just values
- `orElse(fn: () => TrueMythMaybe): TrueMythMaybe` - Provides alternative for nothing
- `toResult(errorMessage?: string): TrueMythResult` - Converts to Result type

#### Events
- `maybe-created` - Emitted when component is connected

### TrueMythTask

#### Attributes
- `value` (string): The task value
- `is-pending` (boolean): Whether task is running
- `is-completed` (boolean): Whether task succeeded
- `is-failed` (boolean): Whether task failed

#### Methods
- `run(): Promise<TrueMythResult>` - Starts task execution
- `resolve(value: string): void` - Completes task successfully
- `reject(error: string): void` - Fails task
- `toResult(): TrueMythResult` - Converts current state to Result
- `map(fn: (value: string) => string): TrueMythTask` - Transforms completed value
- `andThen(fn: (value: string) => TrueMythTask): TrueMythTask` - Chains tasks

#### Events
- `task-created` - Emitted when component is connected
- `task-started` - Emitted when `run()` is called
- `task-completed` - Emitted when task succeeds
- `task-failed` - Emitted when task fails

### InstanceProvider

#### Attributes
- `component-type` ('result' | 'ok' | 'error' | 'task' | 'maybe'): Type of component to provide
- `value` (string): Default value for created instances

#### Methods
- `get(): { type: string, value: string, timestamp: number }` - Returns provider info
- `createInstance(value?: string): HTMLElement` - Creates new component instance

#### Events
- `registered` - Emitted when registered with container

### Dependency Injection Container

#### Functions
- `getOrCreateDOMContainer(): Promise<DOMContainer>` - Gets or creates the global container

#### DOMContainer Interface
- `register(type: string, provider: object): void` - Registers a provider
- `unregister(type: string): void` - Unregisters a provider
- `get(type: string): object | undefined` - Gets a provider
- `getAll(): Map<string, object>` - Gets all providers
- `clear(): void` - Clears all providers

## Usage Patterns

### 1. Form Validation

```html
<true-myth-result id="email-result"></true-myth-result>
<true-myth-result id="password-result"></true-myth-result>

<script>
  function validateEmail(email) {
    const result = document.createElement('true-myth-result');
    
    if (!email.includes('@')) {
      result.value = 'Invalid email';
      result.isError = true;
    } else {
      result.value = email;
      result.isOk = true;
    }
    
    return result;
  }
  
  function validateForm(email, password) {
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    
    // Combine validations
    return emailResult.andThen(validEmail => 
      passwordResult.andThen(validPassword => {
        const final = document.createElement('true-myth-ok');
        final.value = `Welcome ${validEmail}`;
        return final;
      })
    );
  }
</script>
```

### 2. Async Data Loading

```html
<true-myth-task id="data-loader"></true-myth-task>
<true-myth-result id="data-result"></true-myth-result>

<script>
  const loader = document.getElementById('data-loader');
  const result = document.getElementById('data-result');
  
  loader.addEventListener('task-completed', (e) => {
    const data = e.detail.value;
    result.value = `Loaded: ${data}`;
    result.isOk = true;
  });
  
  loader.addEventListener('task-failed', (e) => {
    result.value = `Error: ${e.detail.error}`;
    result.isError = true;
  });
  
  // Simulate API call
  setTimeout(() => {
    loader.resolve('user data');
  }, 1000);
</script>
```

### 3. Optional UI Elements

```html
<true-myth-maybe id="user-profile" is-nothing></true-myth-maybe>
<div id="profile-container"></div>

<script>
  const profile = document.getElementById('user-profile');
  const container = document.getElementById('profile-container');
  
  profile.addEventListener('maybe-created', () => {
    // Show/hide based on value presence
    if (profile.isJust) {
      container.innerHTML = `<h2>${profile.value}</h2>`;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  });
  
  // Later, when user logs in
  profile.value = 'John Doe';
  profile.isJust = true;
  profile.isNothing = false;
</script>
```

### 4. Plugin System with DI

```html
<instance-provider component-type="validator" value="default"></instance-provider>
<instance-provider component-type="formatter"></instance-provider>

<script>
  async function createPipeline() {
    const container = await getOrCreateDOMContainer();
    
    // Register custom providers
    container.register('validator', {
      get: () => ({ type: 'email-validator' }),
      createInstance: () => {
        const validator = document.createElement('true-myth-result');
        validator.value = 'validation logic';
        return validator;
      }
    });
    
    container.register('formatter', {
      get: () => ({ type: 'date-formatter' }),
      createInstance: (format) => {
        const formatter = document.createElement('true-myth-maybe');
        formatter.value = format || 'YYYY-MM-DD';
        formatter.isJust = true;
        return formatter;
      }
    });
    
    // Use providers
    const validator = container.get('validator').createInstance();
    const formatter = container.get('formatter').createInstance('MM/DD/YYYY');
    
    document.body.append(validator, formatter);
  }
</script>
```

## Best Practices

### 1. Always Handle Both Cases

```javascript
// ❌ Don't do this
const value = result.unwrap(); // Might throw

// ✅ Do this instead
const value = result.unwrapOr('default');
// or
if (result.isOk) {
  const value = result.unwrap();
} else {
  const error = result.unwrapErr();
  // Handle error
}
```

### 2. Use Method Chaining

```javascript
// Chain operations for cleaner code
const processed = data
  .map(validate)
  .andThen(transform)
  .map(format)
  .unwrapOr('error occurred');
```

### 3. Leverage the Type System

```javascript
// Functions should declare their intent
function getUser(id: string): TrueMythResult {
  // Clearly indicates this can fail
}

function findConfig(key: string): TrueMythMaybe {
  // Clearly indicates this might not find anything
}

function fetchData(url: string): TrueMythTask {
  // Clearly indicates this is async
}
```

### 4. Use Events for UI Updates

```javascript
// Subscribe to state changes
result.addEventListener('result-created', updateUI);
task.addEventListener('task-completed', showData);
task.addEventListener('task-failed', showError);
maybe.addEventListener('maybe-created', toggleVisibility);
```

## Testing

The library includes comprehensive tests using Vitest and happy-dom:

```bash
# Run all tests
npm test

# Run specific test files
npm test -- true-myth.test.ts
npm test -- instance-provider.test.ts

# Watch mode
npm run test:watch

# UI test runner
npm run test:ui
```

## Architecture Notes

### Why Web Components?

1. **Framework Agnostic**: Works with React, Vue, Angular, or vanilla JS
2. **Encapsulation**: Shadow DOM provides style and behavior isolation
3. **Reusability**: Components can be used across projects
4. **Standards-Based**: Built on web standards, not proprietary APIs

### Functional Programming in the DOM

The library brings functional programming patterns to the UI layer:

1. **Immutability**: Components create new instances rather than mutating state
2. **Composability**: Small, focused components that can be combined
3. **Predictability**: Same inputs always produce same outputs
4. **Error Safety**: Compile-time (via TypeScript) and runtime safety

### Dependency Injection Pattern

The `InstanceProvider` pattern enables:

1. **Loose Coupling**: Components don't need to know about each other
2. **Testability**: Easy to mock dependencies
3. **Flexibility**: Swap implementations at runtime
4. **Discovery**: Components can find each other dynamically

## Examples

See `true-myth-example.html` for a complete working example demonstrating all components and patterns.

## TypeScript Support

The library is written in TypeScript and includes full type definitions. Import types as:

```typescript
import { 
  TrueMythResult, 
  TrueMythMaybe, 
  TrueMythTask,
  InstanceProvider,
  getOrCreateDOMContainer 
} from 'v-selector';
```

## Browser Support

The library uses modern web standards and requires browsers with support for:
- Custom Elements v1
- Shadow DOM v1
- ES2015+ features

For older browsers, include polyfills for Custom Elements and Shadow DOM.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## License

MIT

## Inspiration

- [True Myth](https://github.com/true-myth/true-myth) - The original TypeScript library
- [Rust's Result and Option](https://doc.rust-lang.org/std/result/) - For the type system inspiration
- [Elm's Maybe and Result](https://package.elm-lang.org/packages/elm/core/latest/) - For the functional patterns
- [FAST Element](https://www.fast.design/) - For the web component foundation