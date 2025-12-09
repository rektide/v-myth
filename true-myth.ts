import { FASTElement, customElement, attr, html } from '@microsoft/fast-element';

const resultTemplate = html<TrueMythResult>`<template></template>`;

@customElement({
  name: 'true-myth-result',
  template: resultTemplate,
  shadowOptions: null
})
export class TrueMythResult extends FASTElement {
  @attr({ attribute: 'value' })
  value: string = '';

  @attr({ attribute: 'is-ok' })
  isOk: boolean = false;

  @attr({ attribute: 'is-error' })
  isError: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();
    
    if (!this.isOk && !this.isError) {
      this.isOk = true;
    }
    
    this.$emit('result-created', { 
      detail: { 
        value: this.value,
        isOk: this.isOk,
        isError: this.isError
      } 
    });
  }

  unwrap(): string {
    if (this.isError) {
      throw new Error(`Result is an error: ${this.value}`);
    }
    return this.value;
  }

  unwrapOr(defaultValue: string): string {
    if (this.isError) {
      return defaultValue;
    }
    return this.value;
  }

  unwrapErr(): string {
    if (this.isOk) {
      throw new Error(`Result is ok: ${this.value}`);
    }
    return this.value;
  }

  map(fn: (value: string) => string): TrueMythResult {
    if (this.isError) {
      return this;
    }
    
    const newValue = fn(this.value);
    const newResult = document.createElement('true-myth-result') as TrueMythResult;
    newResult.value = newValue;
    newResult.isOk = true;
    newResult.isError = false;
    
    return newResult;
  }

  mapErr(fn: (error: string) => string): TrueMythResult {
    if (this.isOk) {
      return this;
    }
    
    const newError = fn(this.value);
    const newResult = document.createElement('true-myth-result') as TrueMythResult;
    newResult.value = newError;
    newResult.isOk = false;
    newResult.isError = true;
    
    return newResult;
  }

  andThen(fn: (value: string) => TrueMythResult): TrueMythResult {
    if (this.isError) {
      return this;
    }
    
    return fn(this.value);
  }

  orElse(fn: (error: string) => TrueMythResult): TrueMythResult {
    if (this.isOk) {
      return this;
    }
    
    return fn(this.value);
  }
}

const okTemplate = html<TrueMythOk>`<template></template>`;

@customElement({
  name: 'true-myth-ok',
  template: okTemplate,
  shadowOptions: null
})
export class TrueMythOk extends TrueMythResult {
  connectedCallback(): void {
    this.isOk = true;
    this.isError = false;
    super.connectedCallback();
  }
}

const errorTemplate = html<TrueMythError>`<template></template>`;

@customElement({
  name: 'true-myth-error',
  template: errorTemplate,
  shadowOptions: null
})
export class TrueMythError extends TrueMythResult {
  connectedCallback(): void {
    this.isOk = false;
    this.isError = true;
    super.connectedCallback();
  }
}

const taskTemplate = html<TrueMythTask>`<template></template>`;

@customElement({
  name: 'true-myth-task',
  template: taskTemplate,
  shadowOptions: null
})
export class TrueMythTask extends FASTElement {
  @attr({ attribute: 'value' })
  value: string = '';

  @attr({ attribute: 'is-pending' })
  isPending: boolean = true;

  @attr({ attribute: 'is-completed' })
  isCompleted: boolean = false;

  @attr({ attribute: 'is-failed' })
  isFailed: boolean = false;

  private resolveCallback: ((value: string) => void) | null = null;
  private rejectCallback: ((error: string) => void) | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    
    this.$emit('task-created', { 
      detail: { 
        value: this.value,
        isPending: this.isPending,
        isCompleted: this.isCompleted,
        isFailed: this.isFailed
      } 
    });
  }

  async run(): Promise<TrueMythResult> {
    if (this.isCompleted || this.isFailed) {
      return this.toResult();
    }

    this.isPending = true;
    this.$emit('task-started');

    try {
      return new Promise<TrueMythResult>((resolve, reject) => {
        this.resolveCallback = (value: string) => {
          this.value = value;
          this.isPending = false;
          this.isCompleted = true;
          this.isFailed = false;
          this.$emit('task-completed', { detail: { value } });
          resolve(this.toResult());
        };

        this.rejectCallback = (error: string) => {
          this.value = error;
          this.isPending = false;
          this.isCompleted = false;
          this.isFailed = true;
          this.$emit('task-failed', { detail: { error } });
          reject(this.toResult());
        };
      });
    } catch (error) {
      const errorResult = document.createElement('true-myth-error') as TrueMythError;
      errorResult.value = String(error);
      return errorResult;
    }
  }

  resolve(value: string): void {
    if (this.resolveCallback) {
      this.resolveCallback(value);
    }
  }

  reject(error: string): void {
    if (this.rejectCallback) {
      this.rejectCallback(error);
    }
  }

  toResult(): TrueMythResult {
    if (this.isFailed) {
      const error = document.createElement('true-myth-error') as TrueMythError;
      error.value = this.value;
      return error;
    } else {
      const ok = document.createElement('true-myth-ok') as TrueMythOk;
      ok.value = this.value;
      return ok;
    }
  }

  map(fn: (value: string) => string): TrueMythTask {
    const newTask = document.createElement('true-myth-task') as TrueMythTask;
    newTask.value = this.value;
    newTask.isPending = this.isPending;
    newTask.isCompleted = this.isCompleted;
    newTask.isFailed = this.isFailed;

    if (this.isCompleted) {
      newTask.value = fn(this.value);
    }

    return newTask;
  }

  andThen(fn: (value: string) => TrueMythTask): TrueMythTask {
    if (this.isFailed) {
      return this;
    }

    if (this.isCompleted) {
      return fn(this.value);
    }

    const newTask = document.createElement('true-myth-task') as TrueMythTask;
    
    this.run().then(result => {
      if (result.isOk) {
        const nextTask = fn(result.unwrap());
        nextTask.run().then(nextResult => {
          if (nextResult.isOk) {
            newTask.resolve(nextResult.unwrap());
          } else {
            newTask.reject(nextResult.unwrapErr());
          }
        });
      } else {
        newTask.reject(result.unwrapErr());
      }
    });

    return newTask;
  }
}

const maybeTemplate = html<TrueMythMaybe>`<template></template>`;

@customElement({
  name: 'true-myth-maybe',
  template: maybeTemplate,
  shadowOptions: null
})
export class TrueMythMaybe extends FASTElement {
  @attr({ attribute: 'value' })
  value: string = '';

  @attr({ attribute: 'is-just' })
  isJust: boolean = false;

  @attr({ attribute: 'is-nothing' })
  isNothing: boolean = true;

  connectedCallback(): void {
    super.connectedCallback();
    
    if (this.value && !this.isJust && !this.isNothing) {
      this.isJust = true;
      this.isNothing = false;
    }
    
    this.$emit('maybe-created', { 
      detail: { 
        value: this.value,
        isJust: this.isJust,
        isNothing: this.isNothing
      } 
    });
  }

  unwrap(): string {
    if (this.isNothing) {
      throw new Error('Maybe is nothing');
    }
    return this.value;
  }

  unwrapOr(defaultValue: string): string {
    if (this.isNothing) {
      return defaultValue;
    }
    return this.value;
  }

  map(fn: (value: string) => string): TrueMythMaybe {
    if (this.isNothing) {
      return this;
    }
    
    const newValue = fn(this.value);
    const newMaybe = document.createElement('true-myth-maybe') as TrueMythMaybe;
    newMaybe.value = newValue;
    newMaybe.isJust = true;
    newMaybe.isNothing = false;
    
    return newMaybe;
  }

  andThen(fn: (value: string) => TrueMythMaybe): TrueMythMaybe {
    if (this.isNothing) {
      return this;
    }
    
    return fn(this.value);
  }

  orElse(fn: () => TrueMythMaybe): TrueMythMaybe {
    if (this.isJust) {
      return this;
    }
    
    return fn();
  }

  toResult(errorMessage: string = 'Maybe is nothing'): TrueMythResult {
    if (this.isNothing) {
      const error = document.createElement('true-myth-error') as TrueMythError;
      error.value = errorMessage;
      return error;
    } else {
      const ok = document.createElement('true-myth-ok') as TrueMythOk;
      ok.value = this.value;
      return ok;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'true-myth-result': TrueMythResult;
    'true-myth-ok': TrueMythOk;
    'true-myth-error': TrueMythError;
    'true-myth-task': TrueMythTask;
    'true-myth-maybe': TrueMythMaybe;
  }
  
  interface Window {
    TrueMythResult: typeof TrueMythResult;
    TrueMythOk: typeof TrueMythOk;
    TrueMythError: typeof TrueMythError;
    TrueMythTask: typeof TrueMythTask;
    TrueMythMaybe: typeof TrueMythMaybe;
  }
}

if (typeof window !== 'undefined') {
  window.TrueMythResult = TrueMythResult;
  window.TrueMythOk = TrueMythOk;
  window.TrueMythError = TrueMythError;
  window.TrueMythTask = TrueMythTask;
  window.TrueMythMaybe = TrueMythMaybe;
}