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
  tags: string[];
  renderTags: boolean;
  clickOnTags: boolean;
  delayMs: number;
  areaToolAppear: AreaTool;
  areaToolDisappear: AreaTool;
  areaPointStep: number;
  lineGroupSizeMin: number;
  lineGroupSizeMax: number;
  lineGroupAppendSpeedMin: number;
  lineGroupAppendSpeedMax: number;
  lineGroupFade: boolean;
  lineGroupMove: boolean;
  lineGroupMoveDirection: string;
  lineGroupMoveBackward: boolean;
  lineGroupMoveDurationMsMin: number;
  lineGroupMoveDurationMsMax: number;
  cellItemLifetimeMs: number;
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
    if (this.options.lineGroupMoveBackward)
      return this.options.areaToolDisappear.getRandomPointWithStep(this.options.areaPointStep);
    return this.options.areaToolAppear.getRandomPointWithStep(this.options.areaPointStep);
  }

  getPositionToDisappear(): THREE.Vector3 {
    if (this.options.lineGroupMoveBackward)
      return this.options.areaToolAppear.getRandomPointWithStep(this.options.areaPointStep);
    return this.options.areaToolDisappear.getRandomPointWithStep(this.options.areaPointStep);
  }

  getPositionDelta(positionToAppear: THREE.Vector3, positionToDisappear: THREE.Vector3): THREE.Vector3 {
    switch(this.options.lineGroupMoveDirection) {
      case 'xAxis': {
        return new THREE.Vector3(
          positionToDisappear.x - positionToAppear.x,
          0,
          0
        );
      }
      case 'yAxis': {
        return new THREE.Vector3(
          0,
          positionToDisappear.y - positionToAppear.y,
          0
        );
      }
      case 'zAxis': {
        return new THREE.Vector3(
          0,
          0,
          positionToDisappear.z - positionToAppear.z
        );
      }
      default: {
        return new THREE.Vector3(
          positionToDisappear.x - positionToAppear.x,
          positionToDisappear.y - positionToAppear.y,
          positionToDisappear.z - positionToAppear.z
        );
      }
    }
  }

  runRandomTag(): void {

    // - point to appear
    const positionToAppear = this.getPositionToAppear();

    // - point to disappear
    const positionToDisappear = this.getPositionToDisappear();

    // - delta to move
    const positionDelta = this.getPositionDelta(positionToAppear, positionToDisappear);

    // - lineText options
    const lineTextOptions_text = (this.options.renderTags) 
      ? getRandomItemFromArray(this.options.tags).toUpperCase()
      : '';
    const lineTextOptions_indexToAppear = getRandomIntArbitrary(1, 5);
    const lineTextOptions_lifeTime = 5000;
    const lineTextOptions_fade = false;//getRandomBoolean();
    const lineTextOptions_hover_enabled = this.options.clickOnTags;
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
    // const lineTextOptions_hover_onClick = null;
    const lineTextOptions_hover_onClick = (lineGroup: LineGroup): void => {
      console.log({'onClick' : lineGroup.lineTextParams.text});
      alert(lineGroup.lineTextParams.text);
    };

    // - lineGroup options
    const lineGroup_size = lineTextOptions_text.length + getRandomIntArbitrary(this.options.lineGroupSizeMin, this.options.lineGroupSizeMax);
    const lineGroup_appendSpeed = getRandomIntArbitrary(this.options.lineGroupAppendSpeedMin, this.options.lineGroupAppendSpeedMax);
    const lineGroup_fade = this.options.lineGroupFade;
    const lineGroup_move_enabled = this.options.lineGroupMove;
    const lineGroup_move_toPositionDelta = positionDelta;
    const lineGroup_move_duration = getRandomIntArbitrary(this.options.lineGroupMoveDurationMsMin, this.options.lineGroupMoveDurationMsMax);

    // - cellItem options
    const cellItem_animationSppedArray =
      [100, 200, 200, 1000, 1000, 1000, 2000, 2000, 2000, 2000, 2000, 3000, 3000, 3000, 3000, 3000, 3000];
    const cellItem_lifeTime = this.options.cellItemLifetimeMs;

    // - execute via MATHREEQ
    this.mathreeq.executeLineGroup({
      position: {
        x: positionToAppear.x,
        y: positionToAppear.y,
        z: positionToAppear.z,
      },
      lineGroupParams: {
        size: lineGroup_size,
        appendSpeed: lineGroup_appendSpeed,
        fade: lineGroup_fade,
        move: {
          enabled: lineGroup_move_enabled,
          toPositionDelta: lineGroup_move_toPositionDelta,
          duration: lineGroup_move_duration
        }
      },
      cellItemParams: {
        animationSppedArray: cellItem_animationSppedArray,
        lifeTime: cellItem_lifeTime
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
      case 'renderTags': {
        this.options.renderTags = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'clickOnTags': {
        this.options.clickOnTags = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupSizeMin': {
        this.options.lineGroupSizeMin = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupSizeMax': {
        this.options.lineGroupSizeMax = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupAppendSpeedMin': {
        this.options.lineGroupAppendSpeedMin = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupAppendSpeedMax': {
        this.options.lineGroupAppendSpeedMax = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupFade': {
        this.options.lineGroupFade = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupMove': {
        this.options.lineGroupMove = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupMoveDirection': {
        this.options.lineGroupMoveDirection = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupMoveBackward': {
        this.options.lineGroupMoveBackward = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupMoveDurationMsMin': {
        this.options.lineGroupMoveDurationMsMin = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'lineGroupMoveDurationMsMax': {
        this.options.lineGroupMoveDurationMsMax = value;
        if (this.actionInterval instanceof Interval) {
          this.restart();
        }
        return true;
      }
      case 'cellItemLifetimeMs': {
        this.options.cellItemLifetimeMs = value;
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
