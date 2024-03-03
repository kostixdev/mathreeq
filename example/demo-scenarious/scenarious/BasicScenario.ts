import { Interval, Intervaq, Timeout } from "intervaq";
import { MathreeqScenario } from "../../../src/classes/MathreeqScenario";
import { LineGroup, Mathreeq } from "../../../src";
import { AreaTool } from "../../../src/libs/ThreeJsTools.lib";
import { getRandomIntArbitrary, getRandomItemFromArray } from "hellpeq";
import * as THREE from "three";



/**
 * Types
 */

export interface BasicScenarioOptions {
  delayMs: number;
  areaToolAppear: AreaTool;
  areaToolDisappear: AreaTool;
  areaPointStep: number;
}



/**
 * BasicScenario class
 */
export class BasicScenario extends MathreeqScenario<BasicScenarioOptions> {

  actionInterval: Interval | null = null;

  constructor(name: string, mathreeq: Mathreeq, options: BasicScenarioOptions) {
    super(name, mathreeq, options);
  }

  run(): void {
    if (this.actionInterval == null) {
      this.actionInterval = this.mathreeq.intervaq.setInterval(() => {
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
    const lineTextOptions_text = '';// getRandomItemFromArray(this.options.tags).toUpperCase();
    const lineTextOptions_indexToAppear = getRandomIntArbitrary(5, 20);
    const lineTextOptions_lifeTime = 5000;
    const lineTextOptions_fade = true;//getRandomBoolean();
    const lineTextOptions_hover_enabled = false;
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
    };

    // - lineGroup options
    const lineGroup_size = lineTextOptions_text.length + getRandomIntArbitrary(20, 40);
    const lineGroup_appendSpeed = getRandomIntArbitrary(10, 50);
    const lineGroup_move_enabled = true;
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

  stop(): void {
    if (this.actionInterval instanceof Interval) {
      this.mathreeq.intervaq.clearInterval(this.actionInterval);
      this.actionInterval = null;
    }
  }

  setOption(key: string, value: any): boolean {
    switch(key) {
      case 'delayMs': {
        this.options.delayMs = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      default: {
        return false;
      }
    }
  }

  destroy(): void {
    
  }
  
};
