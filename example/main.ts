import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import {
  getRandomIntArbitrary,
  getRandomItemFromArray,
  getRandomBoolean,
  getRangeArrayByStep
} from 'hellpeq';

import { Interval, Intervaq } from 'intervaq';
import { LineGroup, Mathreeq, MathreeqOptions, TextStyleParams } from '../src';
import { AreaTool, ParallaxTool, ParallaxToolOptions } from '../src/libs/ThreeJsTools.lib';
import { HoverDetector } from '../src/classes/HoverDetector';
import { TagsScenario } from './mathreeq-scenarious/TagsScenario';
import { BlankScenario } from './mathreeq-scenarious/BlankScenario';






/*****************************************************************************
 * Some variables
 *****************************************************************************/

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let light: THREE.DirectionalLight;
let raycaster: THREE.Raycaster;
let canvas: HTMLElement;
let renderer: THREE.WebGLRenderer;
let clock: THREE.Clock;
let mixers: THREE.AnimationMixer[] = [];
let hoverDetectors: HoverDetector[] = [];
let stats: Stats;
let gui: GUI;
let pointer: THREE.Vector2 = new THREE.Vector2();
let mouse: THREE.Vector2 = new THREE.Vector2();
let areaToolAppear: AreaTool;
let areaToolDisappear: AreaTool;
let INTERVAQ: Intervaq;
let mathreeqFont: Font;

let MATHREEQ: Mathreeq;

// #TODO: bad feature. finish it.
let intersectedHoverDetectorEnabled: boolean = true;
let intersectedHoverDetector: null | HoverDetector = null;







/*****************************************************************************
 * Some types
 *****************************************************************************/

// - controls stuff
type MathreeqControls = {
  [key: string]: {
    object: null | OrbitControls | ParallaxTool,
    options: {
      enabled: boolean,
      params?: any
    }
  }
};
// - helpers
type MathreeqHelpers = {
  axesHelper?: {
    object: null | THREE.AxesHelper;
    params: {
      visible: boolean;
      size: number;
    };
  };
  gridHelper?: {
    object: null | THREE.GridHelper;
    params: {
      visible: boolean;
      size: number;
      divisions: number;
      transparent: boolean;
      opacity: number;
    };
  };
  lightHelper?: {
    object: null | THREE.DirectionalLightHelper;
    params: {
      visible: boolean;
      size: number;
      color: number;
    };
  };
  // lightCameraHelper: {
  //   object: null;
  //   params: {
  //     visible: boolean;
  //     size: number;
  //     color: number;
  //   };
  // };
};






/*****************************************************************************
 * Configs first
 *****************************************************************************/

// repo const
const REPO_HREF = 'https://github.com/kostixdev/kostix.dev';

// - for mathreeq
// - - textStyleParams
const textStyleParams: TextStyleParams = {
  size: 12,
  height: 0,
  curveSegments: 4,
  bevelEnabled: false,
  bevelSize: 0,
  bevelThickness: 0,
  color: 0x00ff00,
  flatShading: true,
  specular: 0x00ff00,
  shininess: 1,
  wireframe: false,
};
// - - action
const toggleMathreeqActionTimeMs: number = 150;

// - tags to render
const tagsArr = [
  'JavaScript','TypeScript','CoffeeScript',
  'NodeJS','NestJS','Electron','LoopBack','Directus',
  'TypeORM','KnexJS','Sequalize',
  'HTML5','CSS3','Bootstrap','Material Design','jQuery',
  'Angular','ReactJS','VueJS',
  'Webpack',
  'Jest',
  'PHP','Yii2.0','CodeIgniter','Zend','CakePHP','Symfony','Joomla','WordPress','OpenCart','PrestaShop','Bitrix',
  'Java','Python','Delphy','C++','CSharp',
  'MySQL','SqLite','PostgreSQL','MongoDB','Redis','Prometheus','ClickHouse',
  'Grafana','Webmin',
  'Docker','docker-compose',
  'Kubernetes','Cluster',
  'Crypto','Chrome','Linux','Ubuntu','MacOS','Android','Google Glass EE 2.0',
  'NPM','GitHub','GitLab','BitBucket','Jira','Asana',
];

// - chars to init cell items
// - - base (for rain)
const baseStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-_.';
// - - - array of uniq chars from basic charStr
const baseChars = [...new Set(baseStr.split(''))];
// - - text (for tags)
const textStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-_.#+';
// - - - array of uniq chars from basic charStr
const textChars = [...new Set(textStr.split(''))];

// - three.js stuff

// - - canvas
const canvasOptions = {
  id: 'mathreeq',
};

// - - scene
const sceneOptions = {
  background: 0x000000,
};

// - - camera
const cameraOptions = {
  fov: 50,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 4000,
  position: {
    x: 0,
    y: 0,
    z: 700,
  },
  lookAt: {
    x: 0,
    y: 0,
    z: 0,
  },
};

// - - light
const lightOptions = {
  color: 0xffffff,
  intensity: 8,
  position: {
    x: 1,
    y: 1,
    z: 1,
  },
};

// - - renderer
const rendererOptions = {
  size: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
};

// - - font
const fontOptions = {
  url: 'asset/fonts/otf/matrix-code-nfi.otf',
};

// - areaTools

// - - appear
const appearOptions = {
  params: {
    visible: false,
    pointA: {
      x: -750,
      y: 400,
      z: -1000,
    },
    pointB: {
      x: 750,
      y: 200,
      z: -900,
    },
    color: 0x0000ff,
  },
};

// - - disappear
const disappearOptions = {
  params: {
    visible: false,
    pointA: {
      x: -600,
      y: 300,
      z: 1000,
    },
    pointB: {
      x: 600,
      y: 200,
      z: 1100,
    },
    color: 0xff0000,
  },
};






/*****************************************************************************
 * Initial stuff
 *****************************************************************************/

// - controls
const controls: MathreeqControls = {
  orbitControls: {
    object: null,
    options: {
      enabled: true,
    }
  },
  parallaxTool: {
    object: null,
    options: {
      enabled: false,
      params: {
        parallaxLevelX: Math.PI / 15,
        parallaxLevelY: Math.PI / 30,
        mouseWheelLevelY: 0
      }
    }
  }
};
//#TODO: cant remind why i did this
const controlsEnabled = {
  name: 'orbitControls'
};

const helpers: MathreeqHelpers = {
  axesHelper: {
    object: null,
    params: {
      visible: true,
      size: 200
    }
  },
  gridHelper: {
    object: null,
    params: {
      visible: true,
      size: 2000,
      divisions: 100,
      transparent: true,
      opacity: 0.25
    }
  },
  lightHelper: {
    object: null,
    params: {
      visible: true,
      size: 10,
      color: 0xffff00
    }
  },
  // lightCameraHelper: {
  //   object: null,
  //   params: {
  //     visible: false,
  //     size: 5,
  //     color: 0xffffff
  //   }
  // }
};



/*****************************************************************************
 * Init section
 *****************************************************************************/

//#TODO: ... keys
const initHelper = (helperKey: string): void => {
  switch (helperKey) {
    case 'axesHelper': {
      helpers.axesHelper!.object?.dispose();
      helpers.axesHelper!.object = new THREE.AxesHelper( helpers.axesHelper!.params.size );
      helpers.axesHelper!.object.visible = helpers.axesHelper!.params.visible;
      break;
    }
    case 'gridHelper': {
      helpers.gridHelper!.object?.dispose();
      helpers.gridHelper!.object = new THREE.GridHelper(
        helpers.gridHelper!.params.size, 
        helpers.gridHelper!.params.divisions
      );
      // helpers.gridHelper.object.position.y = 0;//- 200;
      helpers.gridHelper!.object.material.opacity = helpers.gridHelper!.params.opacity;
      helpers.gridHelper!.object.material.transparent = helpers.gridHelper!.params.transparent;
      helpers.gridHelper!.object.visible = helpers.gridHelper!.params.visible;
      break;
    }
    case 'lightHelper': {
      helpers.lightHelper!.object?.dispose();
      helpers.lightHelper!.object = new THREE.DirectionalLightHelper(
        light,
        helpers.lightHelper!.params.size,
        helpers.lightHelper!.params.color
      );
      helpers.lightHelper!.object.visible = helpers.lightHelper!.params.visible;
      break;
    }
    default: {

    }
  }
}

const initHelpers = (): void => {
  // - - display axes (x, y, z)
  initHelper('axesHelper');
  scene.add(helpers.axesHelper!.object!);
  // - - display grid
  initHelper('gridHelper');
  scene.add(helpers.gridHelper!.object!);
  // - display light helper (yellow one)
  initHelper('lightHelper');
  scene.add(helpers.lightHelper!.object!);
}


// - STATS init
const initStats = (): void => {
  // - init
  stats = new Stats();
  stats.showPanel(2);
  document.body.appendChild(stats.dom);
  // - customize
  stats.dom.classList.add('stats-dom');
  // stats.dom.classList.add('stats-hidden');
  stats.dom.classList.add('stats-shown');
};

// - GUI init
const initGui = (): void => {
  // - init
  gui = new GUI();
  // - add tools
  // - - controls switcher
  gui.add(controlsEnabled, 'name', Object.keys(controls)).name('controls').onChange(function(value){
    //#TODO: ...
    // disable all
    for (let c in controls) {
      controls[c].object!.enabled = false;
      controls[c].object!.update();
      controls[c].options.enabled = false;
    }
    // enable of value
    controls[value].object!.enabled = true;
    controls[value].object!.update();
    controls[value].options.enabled = true;
    // render result
    render();
  }).setValue(controlsEnabled.name);

  // - - helpers
  GUI_addFolder_helpersFolder(false);

  // - - light
  GUI_addFolder_lightFolder(false);

  // - - helpers.areaDisappearBoxTool
  areaToolAppear.appendGuiFolder(gui, 'areaAppearBoxTool', scene, render);
  areaToolAppear.closeGuiFolder();
  
  // - - helpers.areaDisappearBoxTool
  areaToolDisappear.appendGuiFolder(gui, 'areaDisappearBoxTool', scene, render);
  areaToolDisappear.closeGuiFolder();

  // - - 
  GUI_addFolder_mathreexFolder(true);

};

function GUI_addFolder_mathreexFolder(open: boolean) {
  const mathreexFolder = gui.addFolder('Mathreeq actions');

  const mathreeqScenario = {
    scenario: 'off',
    delay: 150,
  };

  const tagsScenario = new TagsScenario('tags', MATHREEQ, {
    delayMs: mathreeqScenario.delay,
    tags: tagsArr,
    areaToolAppear: areaToolAppear,
    areaToolDisappear: areaToolDisappear,
    areaPointStep: textStyleParams.size
  });

  const blankScenario = new BlankScenario('blank', MATHREEQ, {
    delayMs: mathreeqScenario.delay,
    areaToolAppear: areaToolAppear,
    areaToolDisappear: areaToolDisappear,
    areaPointStep: textStyleParams.size
  });

  const scenarious = [
    'off',
    'blankDefault',
    'blankStopMooving',
    'blankLineByLine',
    'blankLineScreen',
    'tagsDefault',
    'tagsStopMooving',
    'tagsHoverClick',
    'tagsLineByLine'
  ];

  mathreexFolder.add(mathreeqScenario, 'scenario', scenarious).name('scenario').onChange(function(value: string){
    switch(value) {
      case 'off': {
        blankScenario.stop();
        tagsScenario.stop();
        break;
      }
      case 'blankDefault': {
        tagsScenario.stop();
        blankScenario.applyConfig('default');
        blankScenario.run();
        break;
      }
      case 'blankStopMooving': {
        tagsScenario.stop();
        blankScenario.applyConfig('stopMooving');
        blankScenario.run();
        break;
      }
      case 'blankLineByLine': {
        tagsScenario.stop();
        blankScenario.applyConfig('lineByLine');
        blankScenario.run();
        break;
      }
      case 'blankLineScreen': {
        tagsScenario.stop();
        blankScenario.applyConfig('lineScreen');
        blankScenario.run();
        break;
      }
      case 'tagsDefault': {
        blankScenario.stop();
        tagsScenario.applyConfig('default');
        tagsScenario.run();
        break;
      }
      case 'tagsStopMooving': {
        blankScenario.stop();
        tagsScenario.applyConfig('stopMooving');
        tagsScenario.run();
        break;
      }
      case 'tagsHoverClick': {
        blankScenario.stop();
        tagsScenario.applyConfig('hoverClick');
        tagsScenario.run();
        break;
      }
      case 'tagsLineByLine': {
        blankScenario.stop();
        tagsScenario.applyConfig('lineByLine');
        tagsScenario.run();
        break;
      }
      default: {
        break;
      }
    }
  });
  mathreexFolder.add(mathreeqScenario, 'delay', 10, 500, 1).name('delayMs').onChange(function(value: number){
    blankScenario.setDelay(value);
    tagsScenario.setDelay(value);
  });

  (open) 
    ? mathreexFolder.open() 
    : mathreexFolder.close();
}

function GUI_addFolder_helpersFolder(open: boolean) {
  const helpersFolder = gui.addFolder('Helpers');
  helpersFolder.add(helpers.axesHelper!.params, 'visible').name('axesHelper.visible').onChange(function(value: boolean){
    helpers.axesHelper!.object!.visible = value;
    render();
  });
  helpersFolder.add(helpers.axesHelper!.params, 'size', 0, 1000, 10).name('axesHelper.size').onChange(function(value: number){
    helpers.axesHelper!.params.size = value;
    scene.remove(helpers.axesHelper?.object!);
    initHelper('axesHelper');
    scene.add(helpers.axesHelper!.object!);
    render();
  });
  helpersFolder.add(helpers.gridHelper!.params, 'visible').name('gridHelper.visible').onChange(function(value: boolean){
    helpers.gridHelper!.object!.visible = value;
    render();
  });
  helpersFolder.add(helpers.gridHelper!.params, 'size', 0, 2000, 10).name('gridHelper.size').onChange(function(value: number){
    helpers.gridHelper!.params.size = value;
    scene.remove(helpers.gridHelper!.object!);
    initHelper('gridHelper');
    scene.add(helpers.gridHelper!.object!);
    render();
  });
  helpersFolder.add(helpers.gridHelper!.params, 'divisions', 0, 200, 10).name('gridHelper.divisions').onChange(function(value: number){
    helpers.gridHelper!.params.divisions = value;
    scene.remove(helpers.gridHelper!.object!);
    initHelper('gridHelper');
    scene.add(helpers.gridHelper!.object!);
    render();
  });
  helpersFolder.add(helpers.gridHelper!.params, 'transparent').name('gridHelper.transparent').onChange(function(value: boolean){
    helpers.gridHelper!.params.transparent = value;
    scene.remove(helpers.gridHelper!.object!);
    initHelper('gridHelper');
    scene.add(helpers.gridHelper!.object!);
    render();
  });
  helpersFolder.add(helpers.gridHelper!.params, 'opacity', 0, 1, .01).name('gridHelper.opacity').onChange(function(value: number){
    helpers.gridHelper!.params.opacity = value;
    scene.remove(helpers.gridHelper!.object!);
    initHelper('gridHelper');
    scene.add(helpers.gridHelper!.object!);
    render();
  });
  helpersFolder.add(helpers.lightHelper!.params, 'visible').name('lightHelper.visible').onChange(function(value: boolean){
    helpers.lightHelper!.object!.visible = value;
    render();
  });
  helpersFolder.add(helpers.lightHelper!.params, 'size', 0, 50, 1).name('lightHelper.size').onChange(function(value: number){
    helpers.lightHelper!.params.size = value;
    scene.remove(helpers.lightHelper!.object!);
    initHelper('lightHelper');
    scene.add(helpers.lightHelper!.object!);
    render();
  });
  helpersFolder.addColor(helpers.lightHelper!.params, 'color' ).name('lightHelper.color').onChange(function (value: number){
    helpers.lightHelper!.params.color = value;
    scene.remove(helpers.lightHelper!.object!);
    initHelper('lightHelper');
    scene.add(helpers.lightHelper!.object!);
    render();
  } );
  (open) 
    ? helpersFolder.open() 
    : helpersFolder.close();
}

function GUI_addFolder_lightFolder(open: boolean) {
  const lightFolder = gui.addFolder( 'Light' );
  lightFolder.addColor(lightOptions, 'color').name('light.color').onChange(function(value){
    const colorObject = new THREE.Color(value);
    light.color = colorObject;
    render();
  });
  lightFolder.add(lightOptions, 'intensity', 0, 100).name('light.intensity').onChange(function(value){
    light.intensity = value;
    render();
  });
  lightFolder.add(lightOptions.position, 'x', -500, 500).name('light.position.x').onChange(function(value){
    light.position.x = value;
    render();
  });
  lightFolder.add(lightOptions.position, 'y', -500, 500).name('light.position.y').onChange(function(value){
    light.position.y = value;
    render();
  });
  lightFolder.add(lightOptions.position, 'z', -500, 500).name('light.position.z').onChange(function(value){
    light.position.z = value;
    render();
  } );
  (open) 
    ? lightFolder.open() 
    : lightFolder.close();
}







// - init controls
const initControls = (): void => {
  
  // - - moove your scene with mouse
  controls.orbitControls.object = new OrbitControls(camera, renderer.domElement);
  controls.orbitControls.object.minDistance = 20;
  controls.orbitControls.object.maxDistance = 5000;
  controls.orbitControls.object.maxPolarAngle = Math.PI;
  controls.orbitControls.object.enabled = false;

  // - - parallax effect
  controls.parallaxTool.object = new ParallaxTool(
    camera,
    // #TODO: avoid ignoring
    //@ts-ignore
    document as HTMLCanvasElement,//renderer.domElement,
    controls.parallaxTool.options as ParallaxToolOptions
  );
  controls.parallaxTool.object.enabled = true;

};



// - MATHREEQ with async stuff
const mathreqReady = new Promise((resolve, reject) => {
  // - font
  const fontLoader = new TTFLoader();
  fontLoader.load(fontOptions.url, (ttfLoaded) => {
    if(ttfLoaded){
      mathreeqFont = new Font(ttfLoaded);
      // - MATHREEQ
      const mathreeqOptions: MathreeqOptions = {
        scene: scene,
        mixers: mixers,
        hoverDetectors: hoverDetectors,
        baseFont: mathreeqFont,
        intervaq: INTERVAQ,
        textStyleParams: textStyleParams,
        baseChars: baseChars,
        textChars: textChars,
      }
      MATHREEQ = new Mathreeq(mathreeqOptions);
      // - listeners
      //this.addEventListeners();
      resolve(true);
    } else {
      reject();
    }
  });
});



// - init all stuff
const initReady = new Promise((resolve, reject) => {
  // - intervaq
  INTERVAQ = new Intervaq();
  // - scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(sceneOptions.background);
  // - camera
  camera = new THREE.PerspectiveCamera(
    cameraOptions.fov,
    cameraOptions.aspect,
    cameraOptions.near,
    cameraOptions.far
  );
  camera.position.set(
    cameraOptions.position.x,
    cameraOptions.position.y,
    cameraOptions.position.z,
  );
  camera.lookAt(
    cameraOptions.lookAt.x,
    cameraOptions.lookAt.y,
    cameraOptions.lookAt.z,
  );
  // - light
  light = new THREE.DirectionalLight(lightOptions.color, lightOptions.intensity);
  light.position.set(
    lightOptions.position.x,
    lightOptions.position.y,
    lightOptions.position.z,
  ).normalize();
  scene.add(light);
  // - raycaster
  raycaster = new THREE.Raycaster();
  // - canvas
  canvas = document.getElementById(canvasOptions.id) as HTMLElement;
  // - renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setSize(
    rendererOptions.size.width,
    rendererOptions.size.height,
  );
  // - clock
  clock = new THREE.Clock();
  // - areaTools
  // - - appear
  areaToolAppear = new AreaTool(appearOptions);
  scene.add(areaToolAppear.helper);
  // - - disappear
  areaToolDisappear = new AreaTool(disappearOptions);
  scene.add(areaToolDisappear.helper);

  initControls();

  initHelpers();

  initStats();

  // initGui();

  // - MATHREEQ
  mathreqReady.then(() => {
    // #TODO: because of using mathreeq... refac
    initGui();
    addEventListeners();
    resolve(true);
  });

});






/*****************************************************************************
 * eventListeners section
 *****************************************************************************/

function addEventListeners(): void {
  canvas
    .addEventListener( 'dblclick',          _fullscreen );
  window
    .addEventListener( 'resize',            _onWindowResize );
  window
    .addEventListener( 'mousemove',         _onMouseMove, false );
  window
    .addEventListener( 'wheel',             _onMouseWheel, false );
  window
    .addEventListener( 'visibilitychange',  _onVisibilityChange );
  window
    .addEventListener( 'click',             _onClick )
  window
    .addEventListener( 'pointermove',       _onPointerMove );
}



function _fullscreen(): void {
  // const screen = this.canvas;
  const screen = document.documentElement;
  if (document.fullscreenElement == null) {
    // @ts-ignore
    if (window.webkitRequestFullscreen !== null) {
      // @ts-ignore
      screen.webkitRequestFullscreen();
    } else {
      screen.requestFullscreen();
    }
  } else {
    document.exitFullscreen();
  }
  const width = screen.clientWidth;
  const height = screen.clientHeight;
  renderer.setSize(width, height, false);
  camera.updateProjectionMatrix();
}



function _onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
}



function _onMouseMove(event: MouseEvent): void {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}



function _onMouseWheel(event: WheelEvent): void {
  // ...
}



function _onVisibilityChange(event: any): void {
  if (event.target.visibilityState === "visible") {
    console.log(`tab is active at ${new Date().getTime()} `);
    setTimeout(() => {
      INTERVAQ.continueProcessing();
      if (MATHREEQ)
        MATHREEQ._onVisibilityChange(true);
    }, 500);
  } else {
    console.log(`tab is inactive at ${new Date().getTime()} `);
    INTERVAQ.pauseProcessing();
    if (MATHREEQ)
      MATHREEQ._onVisibilityChange(false);
  }
}



function _onClick(event: MouseEvent) {
  if (intersectedHoverDetector) {
    intersectedHoverDetector.onClick();
  }
}



function _onPointerMove( event: PointerEvent ) {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}






/*****************************************************************************
 * THREE section
 *****************************************************************************/

function animate(timestamp?: number) {

  render();

  if (stats !== undefined)
    stats.update();

  if (MATHREEQ && timestamp)
    MATHREEQ.currentTimestamp = timestamp;
  if (INTERVAQ && timestamp)
    INTERVAQ.checkToExecute(timestamp);

  requestAnimationFrame(animate);
}



function render() {

  const delta = clock.getDelta();

  mixers.forEach((mixer) => mixer.update(delta));

  if (intersectedHoverDetectorEnabled) {
    
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
      hoverDetectors
    );
    
    if (intersects.length > 0) {
      // smtn in
      if (intersectedHoverDetector !== intersects[0].object) {
        if (intersectedHoverDetector) {
          // still
        } else {
          // new one
          intersectedHoverDetector = intersects[0].object as HoverDetector;//.object.parent;
          if (intersectedHoverDetector.parent) {
            const lineGroup = intersectedHoverDetector.parent as LineGroup;
            lineGroup.onHoverIn();
          }
        }
      }
    } else {
      // nothing in
      if (intersectedHoverDetector) {
        // has current
        if (intersectedHoverDetector.parent) {
          const lineGroup = intersectedHoverDetector.parent as LineGroup;
          lineGroup.onHoverOut();
        }
      }
      intersectedHoverDetector = null;
    }

  }

  renderer.render(scene, camera);
}



function runForestRun(): void {
  // - disable STRICT input first

  // toggleMathreeqAction();
  
}






/*****************************************************************************
 * Start section
 *****************************************************************************/

initReady.then(() => {
  animate();
  runForestRun();
});

export {};
