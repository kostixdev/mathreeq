import { MathreeqScenario } from "../../src/classes/MathreeqScenario";
import { BasicScenario } from "./scenarious/BasicScenario";
import { TagsScenario } from "./scenarious/TagsScenario";



// #TODO: WTF??? generics stuff. refac.
type ScenarioType = BasicScenario | TagsScenario;



export class ScenarioHub {

  stack: ScenarioType[] = [];

  activeScenario: null | ScenarioType = null;

  constructor() {

  }

  registerScenario(scenario: ScenarioType): boolean {
    if (this.getScenarioByName(scenario.name))
      return false;
    this.stack.push(scenario);
    return true;
  }

  getScenarioByName(name: string): ScenarioType | null {
    for (let i in this.stack) {
      if (this.stack[i].name === name)
        return this.stack[i];
    }
    return null;
  }

  runScenario(name: string): boolean {
    if (this.activeScenario) {
      this.activeScenario.stop();
    }
    this.activeScenario = this.getScenarioByName(name);
    if (this.activeScenario) {
      this.activeScenario.run();
      return true;
    }
    return false;
  }

  stopScenario(): boolean {
    if (this.activeScenario) {
      this.activeScenario.stop();
      return true;
    }
    return false;
  }

  setScenarioOption(key: string, value: any, onEachScenario: boolean = false): void {
    if (onEachScenario) {
      this.stack.forEach(scenario => scenario.setOption(key, value));
      return;
    }
    if(this.activeScenario)
      this.activeScenario.setOption(key, value);
  }

};
