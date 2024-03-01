import { Interval, Intervaq } from "intervaq";
import { MathreeqScenario } from "../../src/classes/MathreeqScenario";
import { LineGroup, Mathreeq } from "../../src";
import { AreaTool } from "../../src/libs/ThreeJsTools.lib";
import { getRandomIntArbitrary, getRandomItemFromArray } from "hellpeq";
import THREE = require("three");

/**
 * Types
 */

export interface TagsScenarioOptions {
  delayMs: number;
  tags: string[];
  areaToolAppear: AreaTool;
  areaToolDisappear: AreaTool;
  areaPointStep: number;
}

export interface TagsScenarioConfig {
  lineGroup_move_enabled: boolean;
  lineTextOptions_hover_enabled: boolean;
  lineByLine?: boolean;
}

/**
 * Const
 */

export const configDefault: TagsScenarioConfig = {
  lineGroup_move_enabled: true,
  lineTextOptions_hover_enabled: false,
}
export const configStopMooving: TagsScenarioConfig = {
  lineGroup_move_enabled: false,
  lineTextOptions_hover_enabled: false,
}
export const configHoverClick: TagsScenarioConfig = {
  lineGroup_move_enabled: true,
  lineTextOptions_hover_enabled: true,
}
export const configLineByLine: TagsScenarioConfig = {
  lineGroup_move_enabled: false,
  lineTextOptions_hover_enabled: false,
  lineByLine: true
}

export const configList: {[key: string]: TagsScenarioConfig} = {
  'default': configDefault,
  'stopMooving': configStopMooving,
  'hoverClick': configHoverClick,
  'lineByLine': configLineByLine,
}

/**
 * TagsScenario class
 */
export class TagsScenario extends MathreeqScenario<TagsScenarioOptions> {

  actionInterval: Interval | null = null;

  config: TagsScenarioConfig = configDefault;

  counter: number = 0;

  constructor(name: string, mathreeq: Mathreeq, options: TagsScenarioOptions) {
    super(name, mathreeq, options);
  }

  run(): void {
    if (this.actionInterval == null) {
      this.actionInterval = this.mathreeq.intervaq.setInterval(() => {
        this.counter++;
        this.runRandomTag();
      }, this.options.delayMs);
    }
  }

  setDelay(value: number): void {
    this.options.delayMs = value;
    if (this.actionInterval !== null) {
      this.stop();
      this.run();
    }
  }

  getPositionToAppear(): THREE.Vector3 {
    if (this.config['lineByLine']) {
      const xDiff = this.options.areaToolAppear.params.pointB.x - this.options.areaToolAppear.params.pointA.x;
      const xLength = Math.floor(xDiff / this.options.areaPointStep);
      const indexToApper = this.counter % xLength;
      const xToAppear = this.options.areaToolAppear.params.pointA.x + (indexToApper * this.options.areaPointStep);
      return new THREE.Vector3(
        xToAppear,
        this.options.areaToolAppear.params.pointA.y,
        this.options.areaToolAppear.params.pointA.z);
    }
    return this.options.areaToolAppear.getRandomPointWithStep(this.options.areaPointStep);
  }

  runRandomTag(): void {

    // - point to appear
    const positionToAppear = this.getPositionToAppear();
    const x = positionToAppear.x;
    const y = positionToAppear.y;
    const z = positionToAppear.z;

    // - delta to disappear
    const positionToDisappear = this.options.areaToolDisappear.getRandomPointWithStep(this.options.areaPointStep);
    const positionDelta = {
      x: 0,
      y: 0,
      z: positionToDisappear.z - positionToAppear.z
    };

    // - lineText options
    const lineTextOptions_text = getRandomItemFromArray(this.options.tags).toUpperCase();
    const lineTextOptions_indexToAppear = getRandomIntArbitrary(5, 20);
    const lineTextOptions_lifeTime = 5000;
    const lineTextOptions_fade = true;//getRandomBoolean();
    const lineTextOptions_hover_enabled = this.config.lineTextOptions_hover_enabled;
    // const lineTextOptions_hover_onHoverIn = null;
    const lineTextOptions_hover_onHoverIn = (lineGroup: LineGroup): void => {
      lineGroup.onHoverInDefault();
      document.body.style.cursor = 'pointer';
    };
    // const lineTextOptions_hover_onHoverOut = null;
    const lineTextOptions_hover_onHoverOut = (lineGroup: LineGroup): void => {
      lineGroup.onHoverOutDefault();
      document.body.style.cursor = 'default';
    };
    const lineTextOptions_hover_onClick = (lineGroup: LineGroup): void => {
      console.log({'onClick' : lineGroup.lineTextParams.text});
      alert(lineGroup.lineTextParams.text);
      // intersectedHoverDetectorEnabled = false;
      // lineGroup.onHoverOut();
      // intersectedHoverDetector = null;
      // lineGroup.execution?.moving?.setDuration(1);
      // MATHREEQ?.lineGroups.forEach((lg: LineGroup) => {
      //   lg.execution?.moving?.setDuration(1);
      // })
      // setTimeout(() => {
      //   intersectedHoverDetectorEnabled = true;
      // }, 1000);
    };

    // - lineGroup options
    const lineGroup_size = lineTextOptions_text.length + getRandomIntArbitrary(20, 80);
    const lineGroup_appendSpeed = getRandomIntArbitrary(10, 50);
    const lineGroup_move_enabled = this.config['lineGroup_move_enabled'];
    const lineGroup_move_toPositionDelta = positionDelta;
    const lineGroup_move_duration = getRandomIntArbitrary(5, 8) * 1000;

    // - cellItem options
    const cellItem_animationSppedArray =
      [100, 200, 200, 1000, 1000, 1000, 2000, 2000, 2000, 2000, 2000, 3000, 3000, 3000, 3000, 3000, 3000];
    const cellItem_lifeTime = 3000;
    const cellItem_fade = true;//getRandomBoolean();

    // - execute via MATHREEQ
    this.mathreeq.executeLineGroup({
      position: {
        x,
        y,
        z
      },
      lineGroupParams: {
        size: lineGroup_size,
        appendSpeed: lineGroup_appendSpeed,
        move: {
          enabled: lineGroup_move_enabled,
          toPositionDelta: lineGroup_move_toPositionDelta,
          duration: lineGroup_move_duration
        }
      },
      cellItemParams: {
        animationSppedArray: cellItem_animationSppedArray,
        lifeTime: cellItem_lifeTime,
        fade: cellItem_fade
      },
      lineTextParams: {
        text: lineTextOptions_text,
        indexToAppear: lineTextOptions_indexToAppear,
        lifeTime: lineTextOptions_lifeTime,
        fade: lineTextOptions_fade,
        hover: {
          enabled: lineTextOptions_hover_enabled,
          onHoverIn: lineTextOptions_hover_onHoverIn,
          onHoverOut: lineTextOptions_hover_onHoverOut,
          onClick: lineTextOptions_hover_onClick,
        },
      }
    });
  }

  applyConfig(configName: string): void {
    if (configList[configName]) {
      this.config = configList[configName];
    }
  }

  stop(): void {
    if (this.actionInterval instanceof Interval) {
      this.mathreeq.intervaq.clearInterval(this.actionInterval);
      this.actionInterval = null;
    }
  }
  
  destroy(): void {
    
  }
};