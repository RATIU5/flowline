import { Effect, pipe } from "effect";
import type { ElementSelector } from "./types.js";
import { AdapterError } from "./types.js";

/**
 * DOM utilities for vanilla adapter operations
 */
export class DOMUtils implements ElementSelector {
  constructor(private readonly root: Document | Element = document) {}

  query<T extends HTMLElement = HTMLElement>(
    selector: string,
  ): Effect.Effect<T | null, AdapterError> {
    return Effect.try({
      try: () => this.root.querySelector<T>(selector),
      catch: (error) =>
        new AdapterError({
          message: `Failed to query selector "${selector}": ${error}`,
          operation: "query",
          cause: error,
        }),
    });
  }

  queryAll<T extends HTMLElement = HTMLElement>(
    selector: string,
  ): Effect.Effect<NodeListOf<T>, AdapterError> {
    return Effect.try({
      try: () => this.root.querySelectorAll<T>(selector),
      catch: (error) =>
        new AdapterError({
          message: `Failed to query all "${selector}": ${error}`,
          operation: "queryAll",
          cause: error,
        }),
    });
  }

  findByName<T extends HTMLElement = HTMLElement>(
    name: string,
  ): Effect.Effect<T | null, AdapterError> {
    return this.query<T>(`[name="${name}"]`);
  }

  findFormFields(): Effect.Effect<Record<string, HTMLElement>, AdapterError> {
    return pipe(
      this.queryAll<HTMLElement>('[name]:not([disabled])'),
      Effect.map((elements) => {
        const fields: Record<string, HTMLElement> = {};
        elements.forEach((element) => {
          const name = element.getAttribute('name');
          if (name) {
            fields[name] = element;
          }
        });
        return fields;
      }),
    );
  }

  static isInputElement(
    element: HTMLElement,
  ): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    return (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    );
  }

  static getInputValue(element: HTMLElement): string {
    if (!this.isInputElement(element)) {
      return '';
    }

    // After type guard, element is known to be HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    if (element.type === 'checkbox' && element instanceof HTMLInputElement) {
      return element.checked ? 'true' : 'false';
    }

    if (element.type === 'radio' && element instanceof HTMLInputElement) {
      return element.checked ? element.value : '';
    }

    return element.value;
  }

  static setInputValue(element: HTMLElement, value: string): Effect.Effect<void, AdapterError> {
    return Effect.try({
      try: () => {
        if (!this.isInputElement(element)) {
          throw new Error('Element is not a valid input element');
        }

        if (element.type === 'checkbox' && element instanceof HTMLInputElement) {
          element.checked = value === 'true' || value === '1';
        } else if (element.type === 'radio' && element instanceof HTMLInputElement) {
          element.checked = element.value === value;
        } else {
          element.value = value;
        }

        // Dispatch input event to trigger any listeners
        element.dispatchEvent(new Event('input', { bubbles: true }));
      },
      catch: (error) =>
        new AdapterError({
          message: `Failed to set value: ${error}`,
          operation: "setInputValue",
          cause: error,
        }),
    });
  }

  static addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): Effect.Effect<() => void, AdapterError> {
    return Effect.try({
      try: () => {
        element.addEventListener(type, listener, options);
        return () => element.removeEventListener(type, listener, options);
      },
      catch: (error) =>
        new AdapterError({
          message: `Failed to add event listener: ${error}`,
          operation: "addEventListener",
          cause: error,
        }),
    });
  }
}