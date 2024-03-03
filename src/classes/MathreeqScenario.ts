import { Mathreeq } from "./Mathreeq";

/** 
 * NathreeqScenario class
 * */
export class MathreeqScenario<T> {
  name: string;
  
  mathreeq: Mathreeq;

  options: T;

  constructor(name: string, mathreeq: Mathreeq, options: T) {
    this.name = name;
    this.mathreeq = mathreeq;
    this.options = options;
  }

  run(): void {
    
  }

  stop(): void {

  }

  restart(): void {
    this.stop();
    this.run();
  }

  setOption(key: string, value: any): boolean {
    return true;
  }

  destroy(): void {

  }
};