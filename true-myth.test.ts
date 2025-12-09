import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TrueMythResult, TrueMythOk, TrueMythError, TrueMythTask, TrueMythMaybe } from './true-myth';

describe('TrueMythResult', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  it('should be registered as a custom element', () => {
    expect(customElements.get('true-myth-result')).toBe(TrueMythResult);
  });
  
  it('should have default attribute values', () => {
    const result = new TrueMythResult();
    expect(result.value).toBe('');
    expect(result.isOk).toBe(false);
    expect(result.isError).toBe(false);
  });
  
  it('should default to ok when neither isOk nor isError is set', () => {
    const result = new TrueMythResult();
    container.appendChild(result);
    
    expect(result.isOk).toBe(true);
    expect(result.isError).toBe(false);
  });
  
  it('should emit result-created event when connected', () => {
    const result = new TrueMythResult();
    result.value = 'test-value';
    result.isOk = true;
    
    const createdEvent = vi.fn();
    result.addEventListener('result-created', createdEvent);
    
    container.appendChild(result);
    
    expect(createdEvent).toHaveBeenCalledTimes(1);
    const eventDetail = createdEvent.mock.calls[0][0].detail;
    expect(eventDetail.value).toBe('test-value');
    expect(eventDetail.isOk).toBe(true);
    expect(eventDetail.isError).toBe(false);
  });
  
  describe('unwrap', () => {
    it('should return value for ok result', () => {
      const result = new TrueMythResult();
      result.value = 'success';
      result.isOk = true;
      
      expect(result.unwrap()).toBe('success');
    });
    
    it('should throw for error result', () => {
      const result = new TrueMythResult();
      result.value = 'failure';
      result.isError = true;
      
      expect(() => result.unwrap()).toThrow('Result is an error: failure');
    });
  });
  
  describe('unwrapOr', () => {
    it('should return value for ok result', () => {
      const result = new TrueMythResult();
      result.value = 'success';
      result.isOk = true;
      
      expect(result.unwrapOr('default')).toBe('success');
    });
    
    it('should return default for error result', () => {
      const result = new TrueMythResult();
      result.value = 'failure';
      result.isError = true;
      
      expect(result.unwrapOr('default')).toBe('default');
    });
  });
  
  describe('unwrapErr', () => {
    it('should return error value for error result', () => {
      const result = new TrueMythResult();
      result.value = 'failure';
      result.isError = true;
      
      expect(result.unwrapErr()).toBe('failure');
    });
    
    it('should throw for ok result', () => {
      const result = new TrueMythResult();
      result.value = 'success';
      result.isOk = true;
      
      expect(() => result.unwrapErr()).toThrow('Result is ok: success');
    });
  });
  
  describe('map', () => {
    it('should apply function to ok result', () => {
      const result = new TrueMythResult();
      result.value = 'hello';
      result.isOk = true;
      
      const mapped = result.map(val => val.toUpperCase());
      expect(mapped.value).toBe('HELLO');
      expect(mapped.isOk).toBe(true);
      expect(mapped.isError).toBe(false);
    });
    
    it('should return same result for error', () => {
      const result = new TrueMythResult();
      result.value = 'error';
      result.isError = true;
      
      const mapped = result.map(() => 'should not happen');
      expect(mapped).toBe(result);
    });
  });
  
  describe('mapErr', () => {
    it('should apply function to error result', () => {
      const result = new TrueMythResult();
      result.value = 'error';
      result.isError = true;
      
      const mapped = result.mapErr(val => val.toUpperCase());
      expect(mapped.value).toBe('ERROR');
      expect(mapped.isOk).toBe(false);
      expect(mapped.isError).toBe(true);
    });
    
    it('should return same result for ok', () => {
      const result = new TrueMythResult();
      result.value = 'success';
      result.isOk = true;
      
      const mapped = result.mapErr(() => 'should not happen');
      expect(mapped).toBe(result);
    });
  });
  
  describe('andThen', () => {
    it('should chain functions for ok result', () => {
      const result = new TrueMythResult();
      result.value = 'hello';
      result.isOk = true;
      
      const chained = result.andThen(val => {
        const newResult = document.createElement('true-myth-result') as TrueMythResult;
        newResult.value = val + ' world';
        newResult.isOk = true;
        return newResult;
      });
      
      expect(chained.value).toBe('hello world');
      expect(chained.isOk).toBe(true);
    });
    
    it('should return same result for error', () => {
      const result = new TrueMythResult();
      result.value = 'error';
      result.isError = true;
      
      const chained = result.andThen(val => {
        const newResult = document.createElement('true-myth-result') as TrueMythResult;
        newResult.value = 'should not happen';
        newResult.isOk = true;
        return newResult;
      });
      
      expect(chained).toBe(result);
    });
  });
  
  describe('orElse', () => {
    it('should return same result for ok', () => {
      const result = new TrueMythResult();
      result.value = 'success';
      result.isOk = true;
      
      const chained = result.orElse(() => {
        const newResult = document.createElement('true-myth-result') as TrueMythResult;
        newResult.value = 'should not happen';
        newResult.isError = true;
        return newResult;
      });
      
      expect(chained).toBe(result);
    });
    
    it('should chain functions for error result', () => {
      const result = new TrueMythResult();
      result.value = 'error';
      result.isError = true;
      
      const chained = result.orElse(error => {
        const newResult = document.createElement('true-myth-result') as TrueMythResult;
        newResult.value = 'recovered: ' + error;
        newResult.isOk = true;
        return newResult;
      });
      
      expect(chained.value).toBe('recovered: error');
      expect(chained.isOk).toBe(true);
    });
  });
});

describe('TrueMythOk', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  it('should be registered as a custom element', () => {
    expect(customElements.get('true-myth-ok')).toBe(TrueMythOk);
  });
  
  it('should set isOk to true and isError to false', () => {
    const ok = new TrueMythOk();
    container.appendChild(ok);
    
    expect(ok.isOk).toBe(true);
    expect(ok.isError).toBe(false);
  });
  
  it('should inherit from TrueMythResult', () => {
    const ok = new TrueMythOk();
    expect(ok instanceof TrueMythResult).toBe(true);
  });
});

describe('TrueMythError', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  it('should be registered as a custom element', () => {
    expect(customElements.get('true-myth-error')).toBe(TrueMythError);
  });
  
  it('should set isOk to false and isError to true', () => {
    const error = new TrueMythError();
    container.appendChild(error);
    
    expect(error.isOk).toBe(false);
    expect(error.isError).toBe(true);
  });
  
  it('should inherit from TrueMythResult', () => {
    const error = new TrueMythError();
    expect(error instanceof TrueMythResult).toBe(true);
  });
});

describe('TrueMythTask', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  it('should be registered as a custom element', () => {
    expect(customElements.get('true-myth-task')).toBe(TrueMythTask);
  });
  
  it('should have default attribute values', () => {
    const task = new TrueMythTask();
    expect(task.value).toBe('');
    expect(task.isPending).toBe(true);
    expect(task.isCompleted).toBe(false);
    expect(task.isFailed).toBe(false);
  });
  
  it('should emit task-created event when connected', () => {
    const task = new TrueMythTask();
    task.value = 'initial';
    
    const createdEvent = vi.fn();
    task.addEventListener('task-created', createdEvent);
    
    container.appendChild(task);
    
    expect(createdEvent).toHaveBeenCalledTimes(1);
    const eventDetail = createdEvent.mock.calls[0][0].detail;
    expect(eventDetail.value).toBe('initial');
    expect(eventDetail.isPending).toBe(true);
  });
  
  describe('run', () => {
    it('should return a promise', async () => {
      const task = new TrueMythTask();
      container.appendChild(task);
      
      const promise = task.run();
      expect(promise).toBeInstanceOf(Promise);
      
      task.resolve('done');
      const result = await promise;
      expect(result.value).toBe('done');
      expect(result.isOk).toBe(true);
    });
    
    it('should emit task-started event', async () => {
      const task = new TrueMythTask();
      container.appendChild(task);
      
      const startedEvent = vi.fn();
      task.addEventListener('task-started', startedEvent);
      
      const promise = task.run();
      expect(startedEvent).toHaveBeenCalledTimes(1);
      
      task.resolve('done');
      await promise;
    });
    
    it('should emit task-completed event on success', async () => {
      const task = new TrueMythTask();
      container.appendChild(task);
      
      const completedEvent = vi.fn();
      task.addEventListener('task-completed', completedEvent);
      
      const promise = task.run();
      task.resolve('success');
      
      await promise;
      expect(completedEvent).toHaveBeenCalledTimes(1);
      expect(completedEvent.mock.calls[0][0].detail.value).toBe('success');
    });
    
    it('should emit task-failed event on failure', async () => {
      const task = new TrueMythTask();
      container.appendChild(task);
      
      const failedEvent = vi.fn();
      task.addEventListener('task-failed', failedEvent);
      
      const promise = task.run();
      task.reject('failure');
      
      try {
        await promise;
      } catch (error) {
        // Expected
      }
      
      expect(failedEvent).toHaveBeenCalledTimes(1);
      expect(failedEvent.mock.calls[0][0].detail.error).toBe('failure');
    });
    
    it('should update state on completion', async () => {
      const task = new TrueMythTask();
      container.appendChild(task);
      
      const promise = task.run();
      expect(task.isPending).toBe(true);
      expect(task.isCompleted).toBe(false);
      
      task.resolve('done');
      await promise;
      
      expect(task.isPending).toBe(false);
      expect(task.isCompleted).toBe(true);
      expect(task.isFailed).toBe(false);
      expect(task.value).toBe('done');
    });
    
    it('should update state on failure', async () => {
      const task = new TrueMythTask();
      container.appendChild(task);
      
      const promise = task.run();
      task.reject('error');
      
      try {
        await promise;
      } catch (error) {
        // Expected
      }
      
      expect(task.isPending).toBe(false);
      expect(task.isCompleted).toBe(false);
      expect(task.isFailed).toBe(true);
      expect(task.value).toBe('error');
    });
  });
  
  describe('toResult', () => {
    it('should convert completed task to ok result', () => {
      const task = new TrueMythTask();
      task.value = 'success';
      task.isCompleted = true;
      
      const result = task.toResult();
      expect(result.value).toBe('success');
      expect(result.isOk).toBe(true);
    });
    
    it('should convert failed task to error result', () => {
      const task = new TrueMythTask();
      task.value = 'failure';
      task.isFailed = true;
      
      const result = task.toResult();
      expect(result.value).toBe('failure');
      expect(result.isError).toBe(true);
    });
  });
  
  describe('map', () => {
    it('should apply function to completed task', () => {
      const task = new TrueMythTask();
      task.value = 'hello';
      task.isCompleted = true;
      
      const mapped = task.map(val => val.toUpperCase());
      expect(mapped.value).toBe('HELLO');
      expect(mapped.isCompleted).toBe(true);
    });
    
    it('should not apply function to pending task', () => {
      const task = new TrueMythTask();
      task.value = 'hello';
      task.isPending = true;
      
      const mapped = task.map(val => val.toUpperCase());
      expect(mapped.value).toBe('hello');
      expect(mapped.isPending).toBe(true);
    });
  });
  
  describe('andThen', () => {
    it('should chain tasks', async () => {
      const task = new TrueMythTask();
      container.appendChild(task);
      
      const nextTask = task.andThen(val => {
        const newTask = document.createElement('true-myth-task') as TrueMythTask;
        newTask.value = val + '-chained';
        return newTask;
      });
      
      expect(nextTask).toBeInstanceOf(TrueMythTask);
      
      const runPromise = task.run();
      task.resolve('first');
      await runPromise;
      
      // The chained task should eventually complete
      const nextRunPromise = nextTask.run();
      (nextTask as any).resolve('first-chained');
      const result = await nextRunPromise;
      
      expect(result.value).toBe('first-chained');
    });
  });
});

describe('TrueMythMaybe', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  it('should be registered as a custom element', () => {
    expect(customElements.get('true-myth-maybe')).toBe(TrueMythMaybe);
  });
  
  it('should have default attribute values', () => {
    const maybe = new TrueMythMaybe();
    expect(maybe.value).toBe('');
    expect(maybe.isJust).toBe(false);
    expect(maybe.isNothing).toBe(true);
  });
  
  it('should default to just when value is set', () => {
    const maybe = new TrueMythMaybe();
    maybe.value = 'some-value';
    container.appendChild(maybe);
    
    expect(maybe.isJust).toBe(true);
    expect(maybe.isNothing).toBe(false);
  });
  
  it('should emit maybe-created event when connected', () => {
    const maybe = new TrueMythMaybe();
    maybe.value = 'value';
    maybe.isJust = true;
    
    const createdEvent = vi.fn();
    maybe.addEventListener('maybe-created', createdEvent);
    
    container.appendChild(maybe);
    
    expect(createdEvent).toHaveBeenCalledTimes(1);
    const eventDetail = createdEvent.mock.calls[0][0].detail;
    expect(eventDetail.value).toBe('value');
    expect(eventDetail.isJust).toBe(true);
    expect(eventDetail.isNothing).toBe(false);
  });
  
  describe('unwrap', () => {
    it('should return value for just', () => {
      const maybe = new TrueMythMaybe();
      maybe.value = 'value';
      maybe.isJust = true;
      
      expect(maybe.unwrap()).toBe('value');
    });
    
    it('should throw for nothing', () => {
      const maybe = new TrueMythMaybe();
      maybe.isNothing = true;
      
      expect(() => maybe.unwrap()).toThrow('Maybe is nothing');
    });
  });
  
  describe('unwrapOr', () => {
    it('should return value for just', () => {
      const maybe = new TrueMythMaybe();
      maybe.value = 'value';
      maybe.isJust = true;
      
      expect(maybe.unwrapOr('default')).toBe('value');
    });
    
    it('should return default for nothing', () => {
      const maybe = new TrueMythMaybe();
      maybe.isNothing = true;
      
      expect(maybe.unwrapOr('default')).toBe('default');
    });
  });
  
  describe('map', () => {
    it('should apply function to just', () => {
      const maybe = new TrueMythMaybe();
      maybe.value = 'hello';
      maybe.isJust = true;
      
      const mapped = maybe.map(val => val.toUpperCase());
      expect(mapped.value).toBe('HELLO');
      expect(mapped.isJust).toBe(true);
      expect(mapped.isNothing).toBe(false);
    });
    
    it('should return same maybe for nothing', () => {
      const maybe = new TrueMythMaybe();
      maybe.isNothing = true;
      
      const mapped = maybe.map(val => val.toUpperCase());
      expect(mapped).toBe(maybe);
    });
  });
  
  describe('andThen', () => {
    it('should chain functions for just', () => {
      const maybe = new TrueMythMaybe();
      maybe.value = 'hello';
      maybe.isJust = true;
      
      const chained = maybe.andThen(val => {
        const newMaybe = document.createElement('true-myth-maybe') as TrueMythMaybe;
        newMaybe.value = val + ' world';
        newMaybe.isJust = true;
        return newMaybe;
      });
      
      expect(chained.value).toBe('hello world');
      expect(chained.isJust).toBe(true);
    });
    
    it('should return same maybe for nothing', () => {
      const maybe = new TrueMythMaybe();
      maybe.isNothing = true;
      
      const chained = maybe.andThen(val => {
        const newMaybe = document.createElement('true-myth-maybe') as TrueMythMaybe;
        newMaybe.value = 'should not happen';
        newMaybe.isJust = true;
        return newMaybe;
      });
      
      expect(chained).toBe(maybe);
    });
  });
  
  describe('orElse', () => {
    it('should return same maybe for just', () => {
      const maybe = new TrueMythMaybe();
      maybe.value = 'value';
      maybe.isJust = true;
      
      const chained = maybe.orElse(() => {
        const newMaybe = document.createElement('true-myth-maybe') as TrueMythMaybe;
        newMaybe.value = 'default';
        newMaybe.isJust = true;
        return newMaybe;
      });
      
      expect(chained).toBe(maybe);
    });
    
    it('should chain functions for nothing', () => {
      const maybe = new TrueMythMaybe();
      maybe.isNothing = true;
      
      const chained = maybe.orElse(() => {
        const newMaybe = document.createElement('true-myth-maybe') as TrueMythMaybe;
        newMaybe.value = 'default';
        newMaybe.isJust = true;
        return newMaybe;
      });
      
      expect(chained.value).toBe('default');
      expect(chained.isJust).toBe(true);
    });
  });
  
  describe('toResult', () => {
    it('should convert just to ok result', () => {
      const maybe = new TrueMythMaybe();
      maybe.value = 'value';
      maybe.isJust = true;
      
      const result = maybe.toResult();
      expect(result.value).toBe('value');
      expect(result.isOk).toBe(true);
    });
    
    it('should convert nothing to error result', () => {
      const maybe = new TrueMythMaybe();
      maybe.isNothing = true;
      
      const result = maybe.toResult('custom error');
      expect(result.value).toBe('custom error');
      expect(result.isError).toBe(true);
    });
    
    it('should use default error message', () => {
      const maybe = new TrueMythMaybe();
      maybe.isNothing = true;
      
      const result = maybe.toResult();
      expect(result.value).toBe('Maybe is nothing');
      expect(result.isError).toBe(true);
    });
  });
});