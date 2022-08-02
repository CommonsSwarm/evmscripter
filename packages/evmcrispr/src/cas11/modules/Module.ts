import type { Signer } from 'ethers';

import type { LazyNode } from '../interpreter/Interpreter';
import type { BindingsManager } from '../interpreter/BindingsManager';
import type {
  CommandFunction,
  HelperFunctions,
  RawHelperFunctions,
} from '../types';

const curryHelpers = (
  module: Module,
  helpers: RawHelperFunctions<Module>,
): HelperFunctions => {
  return Object.keys(helpers).reduce(
    (newHelpers: Record<string, (...args: any[]) => any>, helperName) => {
      newHelpers[helperName] = (...args: any[]) =>
        helpers[helperName](module, ...args);
      return newHelpers;
    },
    {},
  );
};

export abstract class Module {
  name: string;
  alias?: string;

  #bindingsManager: BindingsManager;
  #helpers: HelperFunctions;
  #signer: Signer;

  constructor(
    name: string,
    bindingsManager: BindingsManager,
    signer: Signer,
    helpers: RawHelperFunctions<any> = {},
    alias?: string,
  ) {
    this.name = name;
    this.alias = alias;
    this.#bindingsManager = bindingsManager;
    this.#helpers = curryHelpers(this, helpers);
    this.#signer = signer;
  }

  get bindingsManager(): BindingsManager {
    return this.#bindingsManager;
  }

  get helpers(): HelperFunctions {
    return this.#helpers;
  }

  get signer(): Signer {
    return this.#signer;
  }

  abstract interpretCommand(
    name: string,
    lazyNodes: LazyNode[],
    signer?: Signer,
  ): ReturnType<CommandFunction<Module>>;

  getModuleVariable(name: string): any {
    return this.bindingsManager.getBinding(this.#buildModuleVariable(name));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  setModuleVariable(name: string, value: any, isGlobal = false): void {
    this.bindingsManager.setBinding(
      this.#buildModuleVariable(name),
      value,
      false,
      isGlobal,
    );
  }

  panic(msg: string): void {
    throw new Error(msg);
  }

  #buildModuleVariable(name: string): string {
    return `$${this.name}:${name}`;
  }
}