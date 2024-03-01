import * as THREE from 'three';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry';
import {Font} from 'three/examples/jsm/loaders/FontLoader.js';
import {LineGroup, LineGroupOptions} from './LineGroup';
import {Intervaq} from 'intervaq';
import {HoverDetector} from './HoverDetector';

/**
 * Types
 */

export interface TextStyleParams {
  size: number;
  height: number;
  curveSegments: number;
  bevelEnabled: boolean;
  bevelSize: number;
  bevelThickness: number;
  color: number;
  flatShading: boolean;
  specular: number;
  shininess: number;
  wireframe: boolean;
}

export type Char = string;

export type CharMaterial = THREE.MeshPhongMaterial;

export type CharMaterialsMap = Map<string, null | CharMaterial>;

export type CharGeometry = TextGeometry;

export type CharGeometriesMap = Map<string, null | CharGeometry>;

export type AnimationMixer = THREE.AnimationMixer;
export type AnimationAction = THREE.AnimationAction;

// #TODO: mk smtn with mix of string and UUID of crypto
export type UUID = string;

export type LineGroupsMap = Map<UUID, LineGroup>;

export interface MathreeqOptions {
  scene: THREE.Scene;
  mixers: THREE.AnimationMixer[];
  hoverDetectors: HoverDetector[];
  baseFont: Font;
  intervaq: Intervaq;
  textStyleParams: Partial<TextStyleParams>;
  baseChars: Char[];
  textChars: Char[];
}

export interface MathreeqShared {
  mixers: THREE.AnimationMixer[];
  hoverDetectors: HoverDetector[];
  intervaq: Intervaq;
  textChars: Char[];
  textStyleParams: TextStyleParams;
  materials: CharMaterialsMap;
  geometries: CharGeometriesMap;
  getCurrentTimestamp: Function;
}

/**
 * Mathreeq class.
 */
export class Mathreeq {
  scene: THREE.Scene;

  mixers: THREE.AnimationMixer[];

  hoverDetectors: HoverDetector[];

  baseFont: Font;

  intervaq: Intervaq;

  textStyleParams: TextStyleParams = {
    size: 12,
    height: 0,
    curveSegments: 3,
    bevelEnabled: false,
    bevelSize: 0,
    bevelThickness: 0,
    color: 0x00ff00,
    flatShading: true,
    specular: 0x00ff00,
    shininess: 1,
    wireframe: false,
  };

  baseChars: Char[] = []; // initial base chars array

  textChars: Char[] = []; // initial text chars array

  materials: CharMaterialsMap = new Map([
    ['base', null], // base cellItems (that only animate)
    ['baseLead', null], // lead cellItem (that is just appeared)
    ['lineTextBase', null], // lineText cellItems (of text that appears)
  ]);

  // char -> TextGeometry
  geometries: CharGeometriesMap = new Map();
  // lineGroups = [];
  lineGroups: LineGroupsMap = new Map();

  shared: MathreeqShared;

  paused = false;

  currentTimestamp = 0;

  constructor(options: MathreeqOptions) {
    this.scene = options.scene;

    this.mixers = options.mixers;

    this.hoverDetectors = options.hoverDetectors;

    this.baseFont = options.baseFont;

    this.intervaq = options.intervaq;

    this.textStyleParams = {
      ...this.textStyleParams,
      ...options.textStyleParams,
    };

    this.baseChars = options.baseChars || [];

    this.textChars = options.textChars || [];

    // preparations
    this.initMaterials();
    this.initGeometries();

    this.shared = {
      mixers: this.mixers,
      hoverDetectors: this.hoverDetectors,
      intervaq: this.intervaq,
      textChars: this.textChars,
      textStyleParams: this.textStyleParams,
      materials: this.materials,
      geometries: this.geometries,
      getCurrentTimestamp: this.getCurrentTimestamp.bind(this),
    };
  }

  /**
   * Init materials for chars
   */
  initMaterials() {
    // #TODO: mk more flexible to configurate
    this.materials.set(
      'base',
      new THREE.MeshPhongMaterial({
        name: 'base',
        color: this.textStyleParams.color,
        flatShading: this.textStyleParams.flatShading,
        specular: this.textStyleParams.specular,
        shininess: this.textStyleParams.shininess,
        wireframe: this.textStyleParams.wireframe,
        transparent: true,
        opacity: 1,
      })
    );
    this.materials.set(
      'baseLead',
      new THREE.MeshPhongMaterial({
        name: 'baseLead',
        color: 0xffffff,
        flatShading: this.textStyleParams.flatShading,
        specular: this.textStyleParams.color,
        shininess: this.textStyleParams.shininess,
        wireframe: this.textStyleParams.wireframe,
        transparent: true,
        opacity: 1,
      })
    );
    this.materials.set(
      'lineTextBase',
      new THREE.MeshPhongMaterial({
        name: 'lineTextBase',
        color: 0xffffff,
        // color: 0x00ff00,
        flatShading: this.textStyleParams.flatShading,
        specular: 0xffffff,
        // specular: 0x00ff00,
        shininess: this.textStyleParams.shininess,
        wireframe: this.textStyleParams.wireframe,
        transparent: true,
        opacity: 1,
      })
    );
  }

  /**
   * Init geometries of chars
   */
  initGeometries(): void {
    let index = 0;
    while (index < this.textChars.length) {
      this.geometries.set(
        this.textChars[index],
        this.generateGeometryByChar(this.textChars[index])
      );
      index++;
    }
  }

  /**
   * Generate geometry of char
   * @param {Char} char - char
   * @returns {CharGeometry} - geometry of char
   */
  generateGeometryByChar(char: Char): CharGeometry {
    const geometry = new TextGeometry(char, {
      font: this.baseFont,
      size: this.textStyleParams.size,
      height: this.textStyleParams.height,
      curveSegments: this.textStyleParams.curveSegments,
      bevelEnabled: this.textStyleParams.bevelEnabled,
      bevelThickness: this.textStyleParams.bevelThickness,
      bevelSize: this.textStyleParams.bevelSize,
    });
    geometry.computeBoundingSphere();
    return geometry;
  }

  /**
   * Get geometry of char or generate if not exists
   * @param {Char} char - char
   * @returns {CharGeometry} - geometry of char
   */
  getGeometryByChar(char: Char): null | undefined | CharGeometry {
    const geometry = this.geometries.get(char);
    if (geometry) {
      return geometry;
    }
    const geometryGenerated = this.generateGeometryByChar(char);
    this.geometries.set(char, geometryGenerated);
    return this.geometries.get(char) as CharGeometry;
  }

  /**
   * Add and execute LineGroup
   * @param {LineGroupOptions} options - LineGroup behavior options
   * @returns void
   */
  executeLineGroup(options: LineGroupOptions): void {
    if (this.paused) return;
    const lineGroup = this.addLineGroup(options);
    lineGroup.execute();
  }

  /**
   * Add new LineGroup
   * @param {LineGroupOptions} options - LineGroup behavior options
   * @returns {LineGroup} - LineGroup added
   */
  addLineGroup(options: LineGroupOptions): LineGroup {
    // create one
    const lineGroup = new LineGroup(options, this.shared);
    // add to this
    this.lineGroups.set(lineGroup.uuid, lineGroup);
    // event after current lineGroup disappeared
    lineGroup.addEventListener('disappeared', event => {
      this.removeLineGroupByUUID(lineGroup.uuid);
    });
    // add to scene
    this.scene.add(lineGroup);
    return lineGroup;
  }

  /**
   * Remove somy LineGroup by its UUID
   * @param uuid - UUID of LineGroup
   * @returns {boolean} - is removed
   */
  removeLineGroupByUUID(uuid: UUID): boolean {
    const lineGroup = this.lineGroups.get(uuid);

    if (lineGroup) {
      // remove event listener
      lineGroup.removeEventListener('disappeared', event => {
        this.removeLineGroupByUUID(lineGroup.uuid);
      });
      // destroy
      lineGroup.destroy();
      // remove from scene
      this.scene.remove(lineGroup);
      // remove from mathreeq
      return this.lineGroups.delete(uuid);
    }

    return false;
  }

  /**
   * Clear mathreeq
   * @returns void
   */
  clear(): void {
    this.lineGroups.forEach(lineGroup =>
      this.removeLineGroupByUUID(lineGroup.uuid)
    );
  }

  /**
   * Getting current timestamp of mathreeq
   * @returns {number} - current timestamp
   */
  getCurrentTimestamp(): number {
    return this.currentTimestamp;
  }

  /**
   * Functionality for switching visibility state.
   * @param {boolean} visible - visibility state to apply
   * @returns void
   */
  _onVisibilityChange(visible: boolean): void {
    if (this.paused === !visible) return;

    this.paused = !visible;

    if (visible) {
      // set unpaused
      this.lineGroups.forEach(lineGroup =>
        lineGroup.setAnimationActionsPaused(false)
      );
      return;
    }
    // set paused
    this.lineGroups.forEach(lineGroup =>
      lineGroup.setAnimationActionsPaused(true)
    );
  }
}
