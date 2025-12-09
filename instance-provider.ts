import { FASTElement, customElement, attr, html } from '@microsoft/fast-element';

type ComponentType = 'result' | 'ok' | 'error' | 'task' | 'maybe';

interface DOMContainer {
  register(type: ComponentType, provider: { get: () => any; createInstance: (value?: any) => HTMLElement }): void;
  unregister(type: ComponentType): void;
  get(type: ComponentType): { get: () => any; createInstance: (value?: any) => HTMLElement } | undefined;
  getAll(): Map<ComponentType, { get: () => any; createInstance: (value?: any) => HTMLElement }>;
  clear(): void;
}

const DOM_CONTAINER_SYMBOL = Symbol.for('dom-container');

async function getOrCreateDOMContainer(): Promise<DOMContainer> {
  if (typeof window === 'undefined') {
    throw new Error('DOM container is only available in browser environment');
  }

  if (!(window as any)[DOM_CONTAINER_SYMBOL]) {
    const container = createDOMContainer();
    (window as any)[DOM_CONTAINER_SYMBOL] = container;
    
    window.addEventListener('unload', () => {
      container.clear();
    });
  }

  return (window as any)[DOM_CONTAINER_SYMBOL];
}

function createDOMContainer(): DOMContainer {
  const providers = new Map<ComponentType, { get: () => any; createInstance: (value?: any) => HTMLElement }>();

  return {
    register(type: ComponentType, provider: { get: () => any; createInstance: (value?: any) => HTMLElement }) {
      providers.set(type, provider);
    },
    
    unregister(type: ComponentType) {
      providers.delete(type);
    },
    
    get(type: ComponentType) {
      return providers.get(type);
    },
    
    getAll() {
      return new Map(providers);
    },
    
    clear() {
      providers.clear();
    }
  };
}

const template = html<InstanceProvider>`<template></template>`;

@customElement({
  name: 'instance-provider',
  template,
  shadowOptions: null
})
export class InstanceProvider extends FASTElement {
  @attr({ attribute: 'component-type' })
  componentType: ComponentType = 'result';

  @attr({ attribute: 'value' })
  value: string = '';

  private container: any = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.registerWithContainer();
  }

  private async registerWithContainer(): Promise<void> {
    try {
      const container = await getOrCreateDOMContainer();
      this.container = container;
      
      container.register(this.componentType, {
        get: () => this.get(),
        createInstance: (value?: any) => this.createInstance(value)
      });
      
      this.$emit('registered', { 
        detail: { 
          componentType: this.componentType,
          container: container 
        } 
      });
    } catch (error) {
      console.error('Failed to register with container:', error);
    }
  }

  get(): any {
    return {
      type: this.componentType,
      value: this.value,
      timestamp: Date.now()
    };
  }

  createInstance(value?: any): HTMLElement {
    const instance = document.createElement(this.getTagName());
    
    if (value !== undefined) {
      instance.setAttribute('value', String(value));
    }
    
    this.appendChild(instance);
    return instance;
  }

  private getTagName(): string {
    switch (this.componentType) {
      case 'result': return 'true-myth-result';
      case 'ok': return 'true-myth-ok';
      case 'error': return 'true-myth-error';
      case 'task': return 'true-myth-task';
      case 'maybe': return 'true-myth-maybe';
      default: return 'true-myth-result';
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    
    if (this.container) {
      this.container.unregister(this.componentType);
      this.container = null;
    }
  }
}

export { getOrCreateDOMContainer };

declare global {
  interface HTMLElementTagNameMap {
    'instance-provider': InstanceProvider;
  }
  
  interface Window {
    InstanceProvider: typeof InstanceProvider;
  }
}

if (typeof window !== 'undefined') {
  window.InstanceProvider = InstanceProvider;
}