import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InstanceProvider } from './instance-provider';
import { getOrCreateDOMContainer } from './instance-provider';

describe('InstanceProvider', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
    // Clear the global container for each test
    const symbol = Symbol.for('dom-container');
    if ((window as any)[symbol]) {
      (window as any)[symbol].clear();
      delete (window as any)[symbol];
    }
  });
  
  it('should be registered as a custom element', () => {
    expect(customElements.get('instance-provider')).toBe(InstanceProvider);
  });
  
  it('should have default attribute values', () => {
    const provider = new InstanceProvider();
    expect(provider.componentType).toBe('result');
    expect(provider.value).toBe('');
  });
  
  it('should update attributes when properties are set', () => {
    const provider = new InstanceProvider();
    container.appendChild(provider);
    
    provider.componentType = 'task';
    provider.value = 'test-value';
    
    expect(provider.getAttribute('component-type')).toBe('task');
    expect(provider.getAttribute('value')).toBe('test-value');
  });
  
  it('should update properties when attributes are set', () => {
    const provider = new InstanceProvider();
    provider.setAttribute('component-type', 'maybe');
    provider.setAttribute('value', 'attribute-value');
    
    expect(provider.componentType).toBe('maybe');
    expect(provider.value).toBe('attribute-value');
  });
  
  it('should register with container when connected', async () => {
    const provider = new InstanceProvider();
    provider.componentType = 'result';
    provider.value = 'test-value';
    
    const registeredEvent = vi.fn();
    provider.addEventListener('registered', registeredEvent);
    
    container.appendChild(provider);
    
    // Wait for async registration
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(registeredEvent).toHaveBeenCalledTimes(1);
    const eventDetail = registeredEvent.mock.calls[0][0].detail;
    expect(eventDetail.componentType).toBe('result');
    expect(eventDetail.container).toBeDefined();
  });
  
  it('should get provider info', async () => {
    const provider = new InstanceProvider();
    provider.componentType = 'ok';
    provider.value = 'ok-value';
    
    container.appendChild(provider);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const info = provider.get();
    expect(info.type).toBe('ok');
    expect(info.value).toBe('ok-value');
    expect(info.timestamp).toBeDefined();
  });
  
  it('should create instances of the correct type', async () => {
    const provider = new InstanceProvider();
    provider.componentType = 'error';
    
    container.appendChild(provider);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const instance = provider.createInstance('error-message');
    expect(instance.tagName.toLowerCase()).toBe('true-myth-error');
    expect(instance.getAttribute('value')).toBe('error-message');
    expect(container.contains(instance)).toBe(true);
  });
  
  it('should unregister from container when disconnected', async () => {
    const provider = new InstanceProvider();
    provider.componentType = 'task';
    
    container.appendChild(provider);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const domContainer = await getOrCreateDOMContainer();
    expect(domContainer.get('task')).toBeDefined();
    
    container.removeChild(provider);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(domContainer.get('task')).toBeUndefined();
  });
  
  describe('getOrCreateDOMContainer', () => {
    it('should create a new container if none exists', async () => {
      const container1 = await getOrCreateDOMContainer();
      expect(container1).toBeDefined();
      expect(typeof container1.register).toBe('function');
      expect(typeof container1.unregister).toBe('function');
      expect(typeof container1.get).toBe('function');
      expect(typeof container1.getAll).toBe('function');
      expect(typeof container1.clear).toBe('function');
    });
    
    it('should return the same container instance', async () => {
      const container1 = await getOrCreateDOMContainer();
      const container2 = await getOrCreateDOMContainer();
      expect(container1).toBe(container2);
    });
    
    it('should allow registration and retrieval of providers', async () => {
      const domContainer = await getOrCreateDOMContainer();
      
      const mockProvider = {
        get: () => ({ type: 'test', value: 'mock' }),
        createInstance: (value?: any) => {
          const elem = document.createElement('div');
          if (value) elem.textContent = value;
          return elem;
        }
      };
      
      domContainer.register('result', mockProvider);
      
      const retrieved = domContainer.get('result');
      expect(retrieved).toBe(mockProvider);
      
      const allProviders = domContainer.getAll();
      expect(allProviders.get('result')).toBe(mockProvider);
    });
    
    it('should allow unregistration of providers', async () => {
      const domContainer = await getOrCreateDOMContainer();
      
      const mockProvider = {
        get: () => ({ type: 'test' }),
        createInstance: () => document.createElement('div')
      };
      
      domContainer.register('maybe', mockProvider);
      expect(domContainer.get('maybe')).toBe(mockProvider);
      
      domContainer.unregister('maybe');
      expect(domContainer.get('maybe')).toBeUndefined();
    });
    
    it('should clear all providers', async () => {
      const domContainer = await getOrCreateDOMContainer();
      
      const mockProvider1 = {
        get: () => ({ type: 'test1' }),
        createInstance: () => document.createElement('div')
      };
      
      const mockProvider2 = {
        get: () => ({ type: 'test2' }),
        createInstance: () => document.createElement('div')
      };
      
      domContainer.register('result', mockProvider1);
      domContainer.register('error', mockProvider2);
      
      expect(domContainer.getAll().size).toBe(2);
      
      domContainer.clear();
      expect(domContainer.getAll().size).toBe(0);
    });
  });
  
  describe('component type mapping', () => {
    it('should map result type to true-myth-result', () => {
      const provider = new InstanceProvider();
      provider.componentType = 'result';
      expect(provider.createInstance().tagName.toLowerCase()).toBe('true-myth-result');
    });
    
    it('should map ok type to true-myth-ok', () => {
      const provider = new InstanceProvider();
      provider.componentType = 'ok';
      expect(provider.createInstance().tagName.toLowerCase()).toBe('true-myth-ok');
    });
    
    it('should map error type to true-myth-error', () => {
      const provider = new InstanceProvider();
      provider.componentType = 'error';
      expect(provider.createInstance().tagName.toLowerCase()).toBe('true-myth-error');
    });
    
    it('should map task type to true-myth-task', () => {
      const provider = new InstanceProvider();
      provider.componentType = 'task';
      expect(provider.createInstance().tagName.toLowerCase()).toBe('true-myth-task');
    });
    
    it('should map maybe type to true-myth-maybe', () => {
      const provider = new InstanceProvider();
      provider.componentType = 'maybe';
      expect(provider.createInstance().tagName.toLowerCase()).toBe('true-myth-maybe');
    });
    
    it('should default to true-myth-result for unknown type', () => {
      const provider = new InstanceProvider();
      (provider as any).componentType = 'unknown';
      expect(provider.createInstance().tagName.toLowerCase()).toBe('true-myth-result');
    });
  });
});