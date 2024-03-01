import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import {getRandomIntArbitrary, getRandomIntArbitraryWithStep} from 'hellpeq';
import {Intervaq} from 'intervaq';

/**
 * Types
 */

/**
 * Idntknw why
 */
export type CoordsXYZ = {
  x: number;
  y: number;
  z: number;
};

// #TODO: ... assignment
export type PositionDelta = CoordsXYZ;

/**
 * AreaTool section
 */

export interface AreaToolOptions {
  params: {
    visible: boolean;
    pointA: CoordsXYZ; // left top back
    pointB: CoordsXYZ; // right bottom front
    color: number;
  };
}

/**
 * AreaTool class
 */
class AreaTool {
  helper: any = null;

  params = {
    visible: true,
    pointA: {
      x: -100,
      y: 100,
      z: -100,
    },
    pointB: {
      x: 100,
      y: -100,
      z: 100,
    },
    color: 0x00ff00,
  };

  // GUI;
  guiFolder: any;
  visible = true;

  constructor(options: AreaToolOptions) {
    Object.assign(this.params, options.params);

    // this.GUI = ( options.GUI ) ? options.GUI : null;

    this.initHelper();
  }

  /**
   * Init helper functionality
   */
  initHelper() {
    this.helper = new THREE.Box3Helper(
      new THREE.Box3().setFromPoints([
        new THREE.Vector3(
          this.params.pointA.x,
          this.params.pointA.y,
          this.params.pointA.z
        ),
        new THREE.Vector3(
          this.params.pointB.x,
          this.params.pointB.y,
          this.params.pointB.z
        ),
      ]),
      new THREE.Color(this.params.color)
    );
    this.helper.visible = this.params.visible;
  }

  /**
   * Refresh helper functionality
   */
  refreshHelper() {
    if (this.helper) this.helper.dispose();
    this.initHelper();
  }

  /**
   * Append folder to Three.js GUI
   * @param GUI - GUI object
   * @param {string} title - title
   * @param {THREE.Scene} scene - env scene
   * @param {Function} renderAction - fn to call render
   * @returns void
   */
  appendGuiFolder(
    gui: GUI,
    title: string,
    scene: THREE.Scene,
    renderAction: Function
  ): void {
    this.guiFolder = gui.addFolder(title);

    this.guiFolder
      .add(this.params, 'visible')
      .name('visible')
      .onChange((newValue: boolean) => {
        this.helper.visible = newValue;
      });

    this.guiFolder
      .addColor(this.params, 'color')
      .name('color')
      .onChange((newValue: number) => {
        const colorObject = new THREE.Color(newValue);
        this.helper.material.color = colorObject;
      });

    for (const key of Object.keys(this.params.pointA)) {
      this.guiFolder
        .add(this.params.pointA, key, -2000, 2000, 10)
        .name('pointA.' + key)
        .onChange((newValue: number) => {
          scene.remove(this.helper);
          this.refreshHelper();
          scene.add(this.helper);
          renderAction();
        });
    }

    for (const key of Object.keys(this.params.pointB)) {
      this.guiFolder
        .add(this.params.pointB, key, -2000, 2000, 10)
        .name('pointB.' + key)
        .onChange((newValue: number) => {
          scene.remove(this.helper);
          this.refreshHelper();
          scene.add(this.helper);
          renderAction();
        });
    }
  }

  /**
   * Open GUI folder
   */
  openGuiFolder(): void {
    this.guiFolder.open();
  }

  /**
   * Close GUI folder
   */
  closeGuiFolder(): void {
    this.guiFolder.close();
  }

  /**
   * Get random point from AreaTool space
   * @returns {THREE.Vector3}
   */
  getRandomPoint(): THREE.Vector3 {
    return new THREE.Vector3(
      getRandomIntArbitrary(this.params.pointA.x, this.params.pointB.x),
      getRandomIntArbitrary(this.params.pointA.y, this.params.pointB.y),
      getRandomIntArbitrary(this.params.pointA.z, this.params.pointB.z)
    );
  }

  /**
   * Get random point from AreaTool space with some step
   * @param {number} step - step value
   * @returns {THREE.Vector3}
   */
  getRandomPointWithStep(step: number): THREE.Vector3 {
    return new THREE.Vector3(
      getRandomIntArbitraryWithStep(
        this.params.pointA.x,
        this.params.pointB.x,
        step
      ),
      getRandomIntArbitraryWithStep(
        this.params.pointA.y,
        this.params.pointB.y,
        step
      ),
      getRandomIntArbitraryWithStep(
        this.params.pointA.z,
        this.params.pointB.z,
        step
      ),
    );
  }

  /**
   * Hide AreaTool
   */
  hide(): void {
    this.helper.visible = false;
    this.visible = false;
  }

  /**
   * Show AreaTool
   */
  show(): void {
    this.helper.visible = true;
    this.visible = true;
  }

  /**
   * Destruct AreaTool
   */
  destruct(): void {
    this.helper.dispose();
    this.helper = null;
  }
}



/**
 * ParallaxTool section
 */

export interface ParallaxToolParams {
  parallaxLevelX: number;
  parallaxLevelY: number;
  mouseWheelLevelY: number;
}
export interface ParallaxToolOptions {
  enabled: boolean;
  params: ParallaxToolParams;
}

/**
 * ParallaxTool class
 */
class ParallaxTool {
  camera: THREE.PerspectiveCamera;

  domElement: HTMLCanvasElement;

  params: ParallaxToolParams = {
    parallaxLevelX: Math.PI / 30,
    parallaxLevelY: Math.PI / 60,
    mouseWheelLevelY: 0.1,
  };

  windowHalf: THREE.Vector2;

  cameraPositionInitial: THREE.Vector3 = new THREE.Vector3();

  isEnabled = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLCanvasElement,
    options: ParallaxToolOptions
  ) {
    Object.assign(this.params, options.params);

    this.camera = camera;

    this.domElement = domElement;

    this.windowHalf = new THREE.Vector2(
      window.innerWidth / 2,
      window.innerHeight / 2
    );

    this.cameraPositionInitial = this.camera.position.clone();

    this.isEnabled = options.enabled;

    // #TODO: here...
    // this.addEventListeners();
  }

  set enabled(value: boolean) {
    if (value) {
      this.enable();
    } else {
      this.disable();
    }
  }

  enable(): void {
    this.isEnabled = true;
    this.cameraPositionInitial = this.camera.position.clone();
    this.camera.updateProjectionMatrix();
    // this.camera.updateMatrix();
    this.addEventListeners();
  }

  disable(): void {
    this.isEnabled = false;
    this.cameraPositionInitial = this.camera.position.clone();
    this.camera.updateProjectionMatrix();
    // this.camera.updateMatrix();
    this.removeEventListeners();
  }

  update() {
    // ...
  }

  addEventListeners(): void {
    this.domElement.addEventListener('resize', this.onWindowResize.bind(this));
    this.domElement.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this),
      false
    );
    this.domElement.addEventListener(
      'wheel',
      this.onMouseWheel.bind(this),
      false
    );
  }

  removeEventListeners(): void {
    this.domElement.removeEventListener(
      'resize',
      this.onWindowResize.bind(this)
    );
    this.domElement.removeEventListener(
      'mousemove',
      this.onMouseMove.bind(this),
      false
    );
    this.domElement.removeEventListener(
      'wheel',
      this.onMouseWheel.bind(this),
      false
    );
  }

  onWindowResize(): void {
    if (!this.isEnabled) return;

    const width = this.domElement.clientWidth; //.innerWidth;
    const height = this.domElement.clientHeight; //.innerHeight;
    this.windowHalf.set(width / 2, height / 2);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // this.camera.updateMatrix();
  }

  // #TODO: z-position on different position of view
  onMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return;

    this.camera.position.x =
      this.cameraPositionInitial.x +
      (event.clientX - this.windowHalf.x) * this.params.parallaxLevelX;
    this.camera.position.y =
      this.cameraPositionInitial.y +
      (event.clientY - this.windowHalf.y) * this.params.parallaxLevelY;
    // this.camera.position.z = this.cameraPositionInitial.z;// + (event.clientY - this.windowHalf.y ) * this.params.parallaxLevelY;
    this.camera.updateProjectionMatrix();
    // this.camera.updateMatrix();
  }

  onMouseWheel(event: WheelEvent): void {
    if (!this.isEnabled) return;
    this.camera.position.z += event.deltaY * this.params.mouseWheelLevelY; // move camera along z-axis
  }

  destroy() {
    this.disable();
    // this.removeEventListeners();
  }
}

/**
 * Winq section
 */

export type Size2 = {
  width: number;
  height: number;
};

export interface WinqOptions {
  size: Size2;
  border: {
    thickness: number;
    color: number;
  };
  position: CoordsXYZ;
}

export type WinqShared = {
  scene: THREE.Scene;
  camera: THREE.Camera;
  intervaq: Intervaq;
};

export type WinqParts = {
  frame: THREE.Line;
};

/**
 * Winq class
 */
class Winq extends THREE.Group {
  type = 'Winq';

  parts: WinqParts;

  shared: WinqShared;

  constructor(options: WinqOptions, shared: WinqShared) {
    super();

    this.shared = shared;

    // this.position.set(
    //   options.position.x,
    //   options.position.y,
    //   options.position.z
    // );
    const forward = this.getCoordsInFrontOfCameraByDistance(1000);
    this.position.set(
      forward.x - options.size.width / 2,
      forward.y - options.size.height / 2,
      forward.z
    );
    this.setRotationFromQuaternion(this.shared.camera.quaternion);

    this.parts = this.generateParts(options);
    this.add(this.parts.frame);

    this.shared.scene.add(this);
  }

  generateParts(options: WinqOptions): WinqParts {
    return {
      frame: this.generateFrame(options),
    };
  }

  generateFrame(options: WinqOptions): THREE.Line {
    const shape = new THREE.Shape()
    //   .moveTo( 0, 0 ) //bl
    //   .lineTo( 0, options.size.height ) //tl
    //   .lineTo( options.size.width, options.size.height ) //tr
    //   .lineTo( options.size.width, 0 ) //br
    //   .lineTo( 0, 0 ); //bl
      .moveTo(0, 20) //bl
      .lineTo(0, options.size.height) //tl
      .lineTo(options.size.width - 20, options.size.height) //tr
      .lineTo(options.size.width, options.size.height - 20) //tr
      .lineTo(options.size.width, 0) //br
      .lineTo(20, 0) //bl
      .lineTo(0, 20); //bl

    shape.autoClose = true;

    const points = shape.getPoints();

    const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(
      geometryPoints,
      new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 1,
        transparent: true,
        opacity: 1,
      })
    );
    // // line.position.set( 0, 200, 0 );
    // const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.shared.camera.quaternion);
    // line.position.set(
    //   forward.x,
    //   forward.y,
    //   forward.z
    //   );

    // line.material.opacity = 0.5;
    // console.log(this.shared);
    // this.position.set(
    //   this.shared.camera.position.x-199,
    //   this.shared.camera.position.y-100,
    //   this.shared.camera.position.z-100,
    //   );
    // //@ts-ignore
    // this.rotation.set(...this.shared.camera.rotation );

    // const extrudeSettings = { depth: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

    // const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

    // const mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: 0x00ff00, side: THREE.DoubleSide } ) );
    // mesh.position.set( 0, 200, 0 );

    return line;
  }

  glitch(): void {
    this.glitchSeparated();
    /*
    this.parts.frame.visible = false;
    // console.log(this.parts.frame);
    const width = 200;
    const height = 300;
    const shape = new THREE.Shape()
      .moveTo( 0, 20 ) //bl
      // ...
      .lineTo(0, 40)
      .lineTo(-10, 40)
      .lineTo(-10, 160)
      .lineTo(0, 160)
      // ...
      .lineTo( 0, height ) //tl
      .lineTo( width-20, height ) //tr
      .lineTo( width, height-20 ) //tr
      // ...
      .lineTo(width, 160)
      .lineTo(width-10, 160)
      .lineTo(width-10, 40)
      .lineTo(width, 40)
      // ...
      .lineTo( width, 0 ) //br
      .lineTo( 20, 0 ) //bl
      .lineTo( 0, 20 ); //bl

    // shape.autoClose = true;

    const points = shape.getPoints();

    const geometryPoints = new THREE.BufferGeometry().setFromPoints( points );

    const line = new THREE.Line(
      geometryPoints,
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 1,
      })
    );
		line.position.set( 0, 200, 0 );
    this.add(line);
    */
  }

  glitchSeparated(): void {
    this.parts.frame.visible = false;

    const width = 200;
    const height = 300;

    let shape;
    let points;
    let geometryPoints;
    let line;

    shape = new THREE.Shape()
      .moveTo(0, 20) //bl
      // ...
      .lineTo(0, 40);

    this.addGlitchLine(shape);

    shape = new THREE.Shape()
      .moveTo(-10, 40)
      .lineTo(-10, 160);

    this.addGlitchLine(shape);

    shape = new THREE.Shape()
      .moveTo(0, 160)
      .lineTo(0, height) //tl
      .lineTo(width - 20, height) //tr
      .lineTo(width, height - 20) //tr
      .lineTo(width, 160);

    this.addGlitchLine(shape);

    shape = new THREE.Shape()
      .moveTo(width - 10, 160)
      .lineTo(width - 10, 40);

    this.addGlitchLine(shape);

    shape = new THREE.Shape()
      .moveTo(width, 40)
      .lineTo(width, 0) //br
      .lineTo(20, 0) //bl
      .lineTo(0, 20); //bl

    this.addGlitchLine(shape);

    // box...
    shape = new THREE.Shape()
      .moveTo(-10, 40)
      .lineTo(-10, 160)
      .lineTo(width - 10, 160)
      .lineTo(width - 10, 40);

    this.addGlitchBox(shape);

    // setTimeout(() => {
    //   this.parts.frame.visible = true;
    // }, 2000);
  }

  addGlitchLine(shape: THREE.Shape): void {
    const points = shape.getPoints();
    const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(
      geometryPoints,
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 1,
      })
    );
    // line.position.set( 0, 200, 0 );
    this.add(line);
  }

  addGlitchBox(shape: THREE.Shape): void {
    shape.autoClose = true;
    const points = shape.getPoints();
    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
      })
    );
    // mesh.position.set( 0, 200, 0 );
    this.add(mesh);
  }

  getCoordsInFrontOfCameraByDistance(dist: number): THREE.Vector3 {
    const result = new THREE.Vector3();

    this.shared.camera.getWorldDirection(result);

    result.multiplyScalar(dist);
    result.add(this.shared.camera.position);

    return result;
    // myObject3D.position.set(cwd.x, cwd.y, cwd.z);
    // myObject3D.setRotationFromQuaternion(camera.quaternion);
  }
}

export {AreaTool, ParallaxTool, Winq};
