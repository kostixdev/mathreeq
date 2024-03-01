import * as THREE from 'three';
import {Char, CharGeometry, CharMaterial} from './Mathreeq';
import {LineGroupShared} from './LineGroup';
import {Interval} from 'intervaq';

/**
 * Types
 */

export interface CellItemParams {
  animationSppedArray: number[];
  lifeTime: number;
  fade: boolean;
}

export interface CellItemOptions {
  lineTextChar: null | Char;
}

export interface CellItemAnimations {
  switching: null | Interval;
  opacity: null | THREE.AnimationAction;
  lineTextOpacity: null | Interval;
}

/**
 * CellItem class.
 */
export class CellItem extends THREE.Mesh {
  type = 'CellItem';

  override material!: CharMaterial;

  shared: LineGroupShared;

  // #TODO: check no initializer
  opacityMixer: null | undefined | THREE.AnimationMixer;
  opacityClip: null | undefined | THREE.AnimationClip;

  animation: CellItemAnimations = {
    switching: null,
    opacity: null,
    lineTextOpacity: null,
  };

  lineTextChar: null | Char = null; // char to render on finalize

  animationActionsPaused = false;

  constructor(
    geometry: CharGeometry,
    material: CharMaterial,
    options: CellItemOptions,
    shared: LineGroupShared
  ) {
    super(geometry, material);

    this.shared = shared;

    this.lineTextChar = options.lineTextChar || null;

    if (this.lineTextChar) {
      this.name = this.lineTextChar;
    }
  }

  // #TODO: ...
  switchMaterial(newMaterial: CharMaterial): void {
    // this.material.dispose();
    // this.material = newMaterial;
    // console.log(newMaterial.color);
    this.material.color = newMaterial.color;
  }
  switchGeometry(newGeometry: CharGeometry): void {
    this.geometry.dispose();
    this.geometry = newGeometry;
  }
  switchOpacity(newOpacity: number): void {
    this.material.opacity = newOpacity;
  }

  animate(switchingSpeed: number, fadeSpeed: null | number): void {
    // if (this.animation.switching) {
    //   this.stopAnimate();
    // }
    this.startAnimate(switchingSpeed, fadeSpeed);
  }

  startAnimate(switchingSpeed: number, fadeSpeed: null | number): void {
    // initial geometry
    const newGeometry = this.shared.getRandomGeometry
      ? this.shared.getRandomGeometry()
      : null;
    if (newGeometry) {
      this.switchGeometry(newGeometry.clone());
    }

    // launch animation switching
    this.startAnimateSwitching(switchingSpeed);

    // launch animation opacity
    if (fadeSpeed !== null) {
      this.startAnimateOpacity(fadeSpeed);
    }
  }

  stopAnimate(): void {
    this.stopAnimateSwitching();
    // this.stopAnimateOpacity();
  }

  startAnimateSwitching(switchingSpeed: number): void {
    this.animation.switching = this.shared.intervaq.setInterval(() => {
      const newGeometry = this.shared.getRandomGeometry
        ? this.shared.getRandomGeometry()
        : null; // #TODO: broken on tab switching
      if (newGeometry) this.switchGeometry(newGeometry.clone());
    }, switchingSpeed);
  }
  stopAnimateSwitching(): void {
    if (this.animation.switching) {
      this.shared.intervaq.clearInterval(this.animation.switching);
      this.animation.switching = null;
    }
  }

  startAnimateOpacity(fadeSpeed: number): void {
    if (this.animation.opacity) {
      return;
    }

    const opacityKF = new THREE.NumberKeyframeTrack(
      '.material.opacity',
      [0, 1],
      [1, 0]
    );

    this.opacityMixer = new THREE.AnimationMixer(this);
    // this.opacityMixer.addEventListener('finished', function (e) {
    //   // console.log({finishedAt: new Date()});
    // });

    this.shared.mixers.push(this.opacityMixer);

    this.opacityClip = new THREE.AnimationClip('CellItem opacity', 2, [
      opacityKF,
    ]);

    this.animation.opacity = new THREE.AnimationAction(
      this.opacityMixer,
      this.opacityClip
    );

    this.animation.opacity.loop = THREE.LoopOnce;
    this.animation.opacity.clampWhenFinished = true;

    const durationS = Math.round(fadeSpeed / 1000);
    this.animation.opacity.setDuration(durationS);

    this.animation.opacity.play();
  }

  stopAnimateOpacity(): void {
    if (this.animation.opacity && this.opacityMixer) {
      this.animation.opacity.paused = true;

      this.opacityMixer.uncacheAction(
        this.opacityClip as THREE.AnimationClip,
        this
      );
      // this.opacityMixer.removeEventListener('finished');

      const index = this.shared.mixers.indexOf(this.opacityMixer);
      if (index !== -1) {
        const s = this.shared.mixers.splice(index, 1);
        this.opacityMixer = null;
        this.animation.opacity = null;
      }
    }
  }

  startAnimateLineTextOpacity(opacitySpeed: number, opacityStep: number): void {
    this.animation.lineTextOpacity = this.shared.intervaq.setInterval(() => {
      const newOpacity = this.material.opacity - opacityStep;
      this.switchOpacity(newOpacity);
      if (newOpacity <= 0) {
        this.stopAnimateLineTextOpacity();
      }
    }, opacitySpeed);
  }
  stopAnimateLineTextOpacity(): void {
    if (this.animation.lineTextOpacity) {
      this.shared.intervaq.clearInterval(this.animation.lineTextOpacity);
      this.animation.lineTextOpacity = null;
    }
  }

  finalize(): void {
    if (this.lineTextChar !== null) {
      // char - render and process
      this.finalizeWithLineTextChar();
    } else {
      // no char - hide
      this.finalizeWithDisappear();
    }
  }
  finalizeWithDisappear(): void {
    this.hide();
  }
  finalizeWithLineTextChar(): void {
    this.stopAnimateOpacity();
    this.switchOpacity(1);

    // set geometry by char
    const newGeometry = this.shared.getGeometryByChar
      ? this.shared.getGeometryByChar(this.lineTextChar)
      : null;
    if (newGeometry) {
      this.switchGeometry(newGeometry.clone());
    }
    // set material to display lineText char
    const newMaterial = this.shared.getMaterialByKey
      ? this.shared.getMaterialByKey('lineTextBase')
      : null;
    if (newMaterial) {
      this.switchMaterial(newMaterial); //.clone());
    }
  }

  hide(): void {
    this.visible = false;
  }

  disappear(): void {
    this.visible = false;
    // this.destroy();
  }

  setAnimationActionsPaused(paused: boolean, pausedAt: number): void {
    if (this.animationActionsPaused === paused) return;

    this.animationActionsPaused = paused;

    if (this.animation.opacity) {
      if (paused) {
        // set paused
        this.animation.opacity.paused = true;
        return;
      }
      // set unpaused
      this.animation.opacity.paused = false;
    }
  }

  /**
   * Destroy functionality. Finalization and heap cleaning.
   */
  destroy(): void {
    if (this.animation.opacity) this.stopAnimateOpacity();
    if (this.animation.switching) this.stopAnimateSwitching();

    if (this.opacityMixer) {
      const index = this.shared.mixers.indexOf(this.opacityMixer);
      if (index !== -1) {
        this.shared.mixers.splice(index, 1);
        this.opacityMixer = null;
        this.animation.opacity = null;
      }
    }

    this.material.dispose();
    this.geometry.dispose();
  }
}
