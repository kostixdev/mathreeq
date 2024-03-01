import * as THREE from 'three';
import {CoordsXYZ} from '../libs/ThreeJsTools.lib';

/**
 * Types
 */

type FunctionVoid = () => void;

type HoverDetectorGeometry = THREE.BoxGeometry;
type HoverDetectorMaterial = THREE.MeshBasicMaterial;
type BoxSize = {
  width: number;
  height: number;
  dept: number;
};

interface HoverDetectorOptions {
  size: number;
  length: number;
  indexToAppear: number;
  onHoverIn: null | FunctionVoid;
  onHoverOut: null | FunctionVoid;
  onClick: null | FunctionVoid;
}

interface HoverDetectorParams {
  size: BoxSize;
  position: CoordsXYZ;
}

/**
 * Defaults
 */

const HoverDetectorGeometryInitial = new THREE.BoxGeometry(0, 0, 0);
const HoverDetectorMaterialInitial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0,
});

// #TODO: try to destroy events stuff and use its basic EventDispatcher
/**
 * `HoverDetector` to detect its linked hovering actions.
 */
class HoverDetector extends THREE.Mesh {
  /**
   * Mesh `type` redeclaration.
   */
  type = 'HoverDetector';

  /**
   * Current options.
   */
  options: HoverDetectorOptions = {
    size: 12,
    length: 5,
    indexToAppear: 5,
    onHoverIn: null,
    onHoverOut: null,
    onClick: null,
  };

  constructor(
    geometry: HoverDetectorGeometry,
    material: HoverDetectorMaterial,
    options: HoverDetectorOptions
  ) {
    super(geometry, material);

    Object.assign(this.options, options);
  }

  /**
   * Increse indexed sizing adaptation
   * @param {number} index - value of indexed sizing
   * @returns void
   */
  incAdapt(index: number): void {
    this.adaptForIndex(index, true);
  }
  /**
   * Decrese indexed sizing adaptation
   * @param {number} index - value of indexed sizing
   * @returns void
   */
  decAdapt(index: number): void {
    this.adaptForIndex(index, false);
  }

  /**
   * Apply/adapt its indexed `size` and `position` params.
   * @param {number} index - value of indexed sizing
   * @param {boolean} inc - `true` for indexed appearing, `false` for indexed disappearing
   * @returns void
   */
  adaptForIndex(index: number, inc: boolean): void {
    const params = this.generateParamsForIndex(index, inc);

    const newGeometry = new THREE.BoxGeometry(
      params.size.width,
      params.size.height,
      params.size.dept
    );
    this.geometry.dispose();
    this.geometry = newGeometry;

    this.position.set(params.position.x, params.position.y, params.position.z);
  }

  /**
   * Generate its indexed `size` and `position` params.
   * @param {number} index - value of indexed sizing
   * @param {boolean} inc - `true` to indexed appearing, `false` to indexed disappearing
   * @returns {HoverDetectorParams}
   */
  generateParamsForIndex(index: number, inc: boolean): HoverDetectorParams {
    const result: HoverDetectorParams = {
      size: {
        width: 0,
        height: 0,
        dept: 0,
      },
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    };

    const size = this.options.size;
    const length = index;
    const indexToAppear = this.options.indexToAppear - 1;

    result.size = {
      width: size,
      height: size * length + (size / 4) * (length + 1),
      dept: 0,
    };

    result.position = {
      x: result.size.width / 3,
      y:
        -(size * indexToAppear) -
        (size / 4) * indexToAppear -
        result.size.height / 2,
      z: -10,
    };

    return result;
  }

  /**
   * `onmouseover` action.
   * @returns void
   */
  onHoverIn(): void {
    if (this.options.onHoverIn instanceof Function) this.options.onHoverIn();
  }
  /**
   * `onmouseout` action.
   * @returns void
   */
  onHoverOut(): void {
    if (this.options.onHoverOut instanceof Function) this.options.onHoverOut();
  }
  /**
   * `click` action.
   * @returns void
   */
  onClick(): void {
    if (this.options.onClick instanceof Function) this.options.onClick();
  }

  /**
   * Hide this object.
   * @returns void
   */
  disappear(): void {
    this.visible = false;
  }

  /**
   * Destroy functionality. Finalization and heap cleaning.
   */
  destroy(): void {
    this.disappear();
    this.geometry.dispose();
  }
}

export {
  HoverDetector,
  HoverDetectorOptions,
  HoverDetectorGeometryInitial,
  HoverDetectorMaterialInitial,
};
