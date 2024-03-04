import * as THREE from 'three';
import {getRandomItemFromArray} from 'hellpeq';
import {CellItem, CellItemOptions, CellItemParams} from './CellItem';
import {Char, CharGeometry, CharMaterial, MathreeqShared} from './Mathreeq';
import {Interval, Intervaq, Timeout} from 'intervaq';
import {
  HoverDetector,
  HoverDetectorGeometryInitial,
  HoverDetectorMaterialInitial,
  HoverDetectorOptions,
} from './HoverDetector';
import {CoordsXYZ, PositionDelta} from '../libs/ThreeJsTools.lib';

/**
 * Types
 */

export interface LineGroupOptions {
  position: CoordsXYZ;
  lineGroupParams: LineGroupParams;
  cellItemParams: CellItemParams;
  lineTextParams: LineTextParams;
}

export interface LineTextParams {
  text: string;
  indexToAppear: number; // of length
  lifeTime: number;
  fade: boolean;
  hover: LineTextHoverParams;
}

export interface LineTextHoverParams {
  enabled: boolean;
  onHoverIn?: null | Function;
  onHoverOut?: null | Function;
  onClick?: null | Function;
}

export interface LineGroupParams {
  size: number;
  appendSpeed: number;
  fade: boolean;
  move: LineMoveParams;
}

export interface LineMoveParams {
  enabled: boolean;
  toPositionDelta: PositionDelta;
  duration: number;
}

export type LineGroupExecutions = {
  // doing appear items
  appearing: null | Interval;
  // doing appear items
  moving: null | THREE.AnimationAction;
  // timeaut to start finalization
  finalizationTrigger: null | Timeout;
  // doing rendering lineText items
  finalization: null | Interval;
  // timeaut to start disappearing
  disappearingTrigger: null | Timeout;
  // doing disappear items
  disappearing: null | Interval;
};

/**
 * Shared data from LineGroup
 */
export type LineGroupShared = {
  mixers: THREE.AnimationMixer[];
  intervaq: Intervaq;
  textChars: Char[];
  getMaterialByKey: Function;
  getGeometryByChar: Function;
  getRandomGeometry: Function;
};

/**
 * Status of LineGroup
 * @enum {number}
 */
export enum StatusLineGroup {
  PAUSED = 0,
  IN_PROCESS = 1,
  APPEARING = 2,
  DISAPPEARING = 4,
  DESTROYING = 5,
  DESTROYED = 6,
}

const _lineGroupDisappearedEvent = {
  type: 'disappeared'
};

/**
 * Mathreeq LineGroup class.
 */
export class LineGroup extends THREE.Group {
  type = 'LineGroup';
  // override children!: CellItem[] & BoxDetector;

  lineGroupParams: LineGroupParams = {
    size: 10, // conut of all cells
    appendSpeed: 300, // speed of cells appending
    move: {
      enabled: true,
      toPositionDelta: {
        x: 0,
        y: 0,
        z: 100,
      },
      duration: 5000,
    },
    fade: true,
  };

  cellItemParams: CellItemParams = {
    animationSppedArray: [100, 200, 300, 400, 500], // speed of cellItems animation (takes rendomly)
    lifeTime: 5000, // lifetime of cellItems, after what it starts to finalize
  };

  lineTextParams: LineTextParams = {
    text: '', // text that should be rendered when cells disappeared
    indexToAppear: 0, // index of cellItem to start lineText rendering
    lifeTime: 5000, // lifetime of text, after what it starts to disappear
    fade: true, // animate opacity 1 -> 0
    hover: {
      // on line text mouse hover
      enabled: false,
      onHoverIn: null,
      onHoverOut: null,
      onClick: null,
    },
  };

  lineTextArray: Char[] = [];

  // #TODO: check no initializer
  movingMixer: null | undefined | THREE.AnimationMixer;
  movingClip: null | undefined | THREE.AnimationClip;

  hoverDetector: null | undefined | HoverDetector;

  execution: LineGroupExecutions = {
    appearing: null,
    moving: null,
    finalizationTrigger: null,
    finalization: null,
    disappearingTrigger: null,
    disappearing: null,
  };

  currentCellItem: null | CellItem = null;

  shared: MathreeqShared;

  animationActionsPaused = false;

  status: StatusLineGroup = StatusLineGroup.IN_PROCESS;

  constructor(options: LineGroupOptions, shared: MathreeqShared) {
    super();

    this.position.set(
      options.position.x,
      options.position.y,
      options.position.z
    );

    Object.assign(this.lineGroupParams, options.lineGroupParams);

    Object.assign(this.cellItemParams, options.cellItemParams);

    Object.assign(this.lineTextParams, options.lineTextParams);

    this.shared = shared;

    if (this.lineTextParams.text) {
      this.name = this.lineTextParams.text;
      this.lineTextArray = this.lineTextParams.text.split('');
    }
  }

  execute() {
    if (this.execution.appearing) {
      this.stopAppearing();
    }
    this.startAppearing();
  }

  startAppearing() {
    if (this.execution.appearing) {
      return;
    }

    if (this.lineGroupParams.move.enabled) {
      this.startMoving();
    }

    // add
    if (this.lineTextParams.hover.enabled) {
      this.appendHoverDetector();
      // #TODO: ... more configs
    }

    // finalization init via intervaq
    let index = 0;
    this.execution.appearing = this.shared.intervaq.setInterval(() => {
      if (index === this.lineGroupParams.size) {
        this.stopAppearing();
        return;
      }

      // add by its index
      const cellItem = this.appendCellItemByIndex(index);

      // randomize switching speed
      const switchingSpeed = getRandomItemFromArray(
        this.cellItemParams.animationSppedArray
      );

      // animate cellItem char switching
      const fadeSpeed = (this.lineGroupParams.fade) 
        ? this.cellItemParams.lifeTime
        : null;
      cellItem.animate(switchingSpeed, fadeSpeed);

      index++;
    }, this.lineGroupParams.appendSpeed);

    // #TODO: replace this and other upper to return section
    // finalizationAction init via intervaq timeout
    this.execution.finalizationTrigger = this.shared.intervaq.setTimeout(() => {
      this.startFinalization();
    }, this.cellItemParams.lifeTime / 2); //#TODO: appears after to much
  }

  appendHoverDetector(): HoverDetector {
    // // is allways at this.children[0]
    const hoverDetectorOptions: HoverDetectorOptions = {
      size: this.shared.textStyleParams.size,
      length: this.lineTextArray.length,
      indexToAppear: this.lineTextParams.indexToAppear,
      onHoverIn: this.onHoverIn.bind(this),
      onHoverOut: this.onHoverOut.bind(this),
      onClick: this.onHoverClick.bind(this),
    };
    this.hoverDetector = new HoverDetector(
      HoverDetectorGeometryInitial,
      HoverDetectorMaterialInitial.clone(),
      hoverDetectorOptions
    );
    this.add(this.hoverDetector);
    this.shared.hoverDetectors.push(this.hoverDetector);
    return this.hoverDetector;
  }
  removeHoverDetector(): boolean {
    if (this.hoverDetector) {
      this.hoverDetector.destroy();
      const index = this.shared.hoverDetectors.indexOf(this.hoverDetector);
      if (index !== -1) {
        this.shared.hoverDetectors.splice(index, 1);
        this.hoverDetector = null;
        return true;
      }
    }
    return false;
  }

  appendCellItemByIndex(index: number): CellItem {
    // #TODO: clone because of mk it for individual transformations (opacity, etc)

    // cellItem position based on current LineGroup
    const position = this.generateCellItemPosition(index);

    // options
    const options: CellItemOptions = {
      lineTextChar:
        index >= this.lineTextParams.indexToAppear &&
        this.lineTextArray[index - this.lineTextParams.indexToAppear]
          ? this.lineTextArray[index - this.lineTextParams.indexToAppear]
          : null,
    };
    const shared: LineGroupShared = {
      mixers: this.shared.mixers,
      intervaq: this.shared.intervaq,
      textChars: this.shared.textChars,
      getMaterialByKey: this.getMaterialByKey.bind(this),
      getGeometryByChar: this.getGeometryByChar.bind(this),
      getRandomGeometry: this.getRandomGeometry.bind(this),
    };

    // switch currentCellItem that is lead to base
    if (this.currentCellItem) {
      const newMaterial = this.shared.materials.get('base') as CharMaterial; // .clone();
      this.currentCellItem.switchMaterial(newMaterial);
    }

    const leadGeometry = this.getRandomGeometry() as CharGeometry;
    const leadMaterial = this.shared.materials.get('baseLead') as CharMaterial; // .clone();

    // create one
    this.currentCellItem = new CellItem(
      leadGeometry.clone(), // no geometry on init, should be set on animate
      leadMaterial.clone(), // lead geometry because of first
      options,
      shared
    );

    this.currentCellItem.position.set(position.x, position.y, position.z);

    // add to current group
    this.add(this.currentCellItem);

    return this.currentCellItem;
  }

  generateCellItemPosition(index: number): CoordsXYZ {
    const size = this.shared.textStyleParams.size;
    return {
      x: 0,
      y: - (size * index) - (size / 4) * index, // 4 - space % textSize
      z: 0,
    };
  }

  stopAppearing(): void {
    if (this.execution.appearing)
      this.shared.intervaq.clearInterval(this.execution.appearing);
    this.execution.appearing = null;
  }

  startMoving(): void {
    if (this.execution.moving) {
      return;
    }

    const toX = this.position.x + this.lineGroupParams.move.toPositionDelta.x;
    const toY = this.position.y + this.lineGroupParams.move.toPositionDelta.y;
    const toZ = this.position.z + this.lineGroupParams.move.toPositionDelta.z;

    const positionKF = new THREE.VectorKeyframeTrack(
      '.position',
      [0, 1],
      [this.position.x, this.position.y, this.position.z, toX, toY, toZ]
    );

    this.movingMixer = new THREE.AnimationMixer(this);
    // this.movingMixer.addEventListener('finished', function (e) {
    //   // console.log({finishedAt: new Date()});
    // });

    this.shared.mixers.push(this.movingMixer);

    this.movingClip = new THREE.AnimationClip('lineGroup moving', 1, [
      positionKF,
    ]);

    this.execution.moving = new THREE.AnimationAction(
      this.movingMixer,
      this.movingClip
    );

    this.execution.moving.loop = THREE.LoopOnce;
    this.execution.moving.clampWhenFinished = true;

    const durationS = Math.round(this.lineGroupParams.move.duration / 1000);
    this.execution.moving.setDuration(durationS);

    this.execution.moving.play();
  }

  stopMoving(): void {
    if (this.execution.moving && this.movingMixer) {
      this.execution.moving.paused = true;

      this.movingMixer.uncacheAction(
        this.movingClip as THREE.AnimationClip,
        this
      );
      // this.movingMixer.removeEventListener('finished');

      const index = this.shared.mixers.indexOf(this.movingMixer);
      if (index !== -1) {
        this.shared.mixers.splice(index, 1);
        this.movingMixer = null;
        this.execution.moving = null;
      }
    }
  }

  startFinalization(): void {
    if (
      this.execution.finalization &&
      this.status !== StatusLineGroup.IN_PROCESS
    ) {
      return;
    }

    // finalization init via intervaq with same speed as appearing
    let index = 0;
    this.execution.finalization = this.shared.intervaq.setInterval(() => {
      // console.log('index', index);
      if (index === this.lineGroupParams.size) {
        this.stopFinalization();
        return;
      }

      // get by its index
      const cellItem = this.children[index] as CellItem;

      // #TODO: children types
      if (cellItem instanceof CellItem) {
        // stop animation
        cellItem.stopAnimate();

        // display char or hide
        if (cellItem.lineTextChar !== null) {
          cellItem.finalizeWithLineTextChar();
          // hoverDetector
          const hoverDetector = this.children[0];// as HoverDetector;
          if (hoverDetector instanceof HoverDetector)
            hoverDetector.incAdapt(index - this.lineTextParams.indexToAppear);
        } else {
          cellItem.finalizeWithDisappear();
        }
      }
      index++;
    }, this.lineGroupParams.appendSpeed);

    // disappearingAction init via intervaq timeout
    this.execution.disappearingTrigger = this.shared.intervaq.setTimeout(() => {
      this.startDisappearing();
    }, this.lineTextParams.lifeTime);
  }

  stopFinalization(): void {
    if (this.execution.finalization) {
      this.shared.intervaq.clearInterval(this.execution.finalization);
      this.execution.finalization = null;
    }
  }

  startDisappearing(): void {
    if (
      this.execution.disappearing &&
      this.status !== StatusLineGroup.IN_PROCESS
    ) {
      return;
    }

    let index = 0;
    this.execution.disappearing = this.shared.intervaq.setInterval(() => {
      if (index === this.lineGroupParams.size) {
        this.stopDisappearing();
        return;
      }

      this.removeCellItem(1); // 0 is allways first

      index++;
    }, this.lineGroupParams.appendSpeed); // same speed as appear
  }

  stopDisappearing(): void {
    if (this.execution.disappearing) {
      this.shared.intervaq.clearInterval(this.execution.disappearing);
      this.execution.disappearing = null;
    }

    // check for all done to disappearedEvent
    if (
      !this.execution.appearing &&
      !this.execution.finalization &&
      !this.execution.disappearing
    ) {
      if (this.lineGroupParams.move.enabled) this.stopMoving();
      this.disappearedEvent();
    }
  }

  // #TODO: add intervaq pausing
  setAnimationActionsPaused(paused: boolean): void {
    if (this.animationActionsPaused === paused) return;

    this.animationActionsPaused = paused;

    const pausedAt = this.shared.getCurrentTimestamp();

    if (this.execution.moving) {
      if (paused) {
        // set paused
        this.execution.moving.paused = true;
        for (let i = 1; i < this.children.length; i++) {
          const cellItem = this.children[i] as CellItem;
          cellItem.setAnimationActionsPaused(paused, pausedAt);
        }
        // this.children.forEach( cellItem => cellItem.setAnimationActionsPaused(paused) );
        return;
      }
      // set unpaused
      this.execution.moving.paused = false;
      for (let i = 1; i < this.children.length; i++) {
        const cellItem = this.children[i] as CellItem;
        cellItem.setAnimationActionsPaused(paused, pausedAt);
      }
    }
    // this.children.forEach( cellItem => cellItem.setAnimationActionsPaused(paused) );
  }

  removeCellItem(index: number): void {
    const cellItem = this.children[index];// as CellItem;
    if (cellItem instanceof CellItem) {
      cellItem.disappear();
      cellItem.destroy();
      this.remove(cellItem);
    }
  }

  getMaterialByKey(key: string): null | undefined | CharMaterial {
    const material = this.shared.materials
      ? this.shared.materials.get(key)
      : null;
    return material;
  }

  getGeometryByChar(char: Char): null | undefined | CharGeometry {
    const geometry = this.shared.geometries
      ? this.shared.geometries.get(char)
      : null;
    return geometry;
  }

  getRandomGeometry(): null | undefined | CharGeometry {
    const randomChar = getRandomItemFromArray(this.shared.textChars);
    return this.getGeometryByChar(randomChar);
  }

  disappearedEvent(): void {
    //@ts-ignore
    this.dispatchEvent(_lineGroupDisappearedEvent);
  }

  // #TODO: use eventDispatcher
  onHoverIn(): void {
    if (this.lineTextParams.hover.enabled) {
      if (this.lineTextParams.hover.onHoverIn instanceof Function) {
        // custom callback
        this.lineTextParams.hover.onHoverIn(this);
      } else {
        // default
        this.onHoverInDefault();
      }
    }
  }
  onHoverInDefault(): void {
    this.setAnimationActionsPaused(true);
  }
  onHoverOut(): void {
    if (this.lineTextParams.hover.enabled) {
      if (this.lineTextParams.hover.onHoverOut instanceof Function) {
        // custom callback
        this.lineTextParams.hover.onHoverOut(this);
      } else {
        // default
        this.onHoverOutDefault();
      }
    }
  }
  onHoverOutDefault(): void {
    this.setAnimationActionsPaused(false);
  }
  onHoverClick(): void {
    if (
      this.lineTextParams.hover.enabled &&
      this.lineTextParams.hover.onClick
    ) {
      this.lineTextParams.hover.onClick(this);
    }
  }

  /**
   * Destroy functionality. Finalization and heap cleaning.
   */
  destroy(): void {
    // console.log('lineGroup.destroy()');
    this.status = StatusLineGroup.DESTROYING;

    if (this.execution.appearing) this.stopAppearing();
    if (this.execution.moving) this.stopMoving();
    if (this.execution.finalizationTrigger)
      this.shared.intervaq.clearTimeout(this.execution.finalizationTrigger);
    if (this.execution.finalization) this.stopFinalization();
    if (this.execution.disappearingTrigger)
      this.shared.intervaq.clearTimeout(this.execution.disappearingTrigger);
    if (this.execution.disappearing) this.stopDisappearing();

    this.removeHoverDetector();

    for (let i = 1; i < this.children.length; i++) {
      this.removeCellItem(1);
    }
  }
}
