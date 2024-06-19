import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';


class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
};


class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }



  _Init(params) {
    this._params = params;
    this._deceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    this._animations = {};
    this._input = new BasicCharacterControllerInput();
    this._stateMachine = new CharacterFSM(
        new BasicCharacterControllerProxy(this._animations));

    this._LoadModels();
    this._SetupCollisionDetection(); // Llamar método para configurar detección de colisiones
  }

  _LoadModels() {
    const loader = new FBXLoader();
    loader.setPath('./resources/warrior/');
    loader.load('warrior.fbx', (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse(c => {
        c.castShadow = true;
      });

      this._target = fbx;
      this._params.scene.add(this._target);

      this._mixer = new THREE.AnimationMixer(this._target);

      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {
        this._stateMachine.SetState('idle');
      };

      const _OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);
  
        this._animations[animName] = {
          clip: clip,
          action: action,
        };
      };

const loader = new FBXLoader(this._manager);
loader.setPath('./resources/warrior/');
loader.load('walk.fbx', (a) => { _OnLoad('walk', a); });
loader.load('run.fbx', (a) => { _OnLoad('run', a); });
loader.load('idle.fbx', (a) => { _OnLoad('idle', a); });
loader.load('attack.fbx', (a) => { _OnLoad('attack', a); });
loader.load('jump.fbx', (a) => { _OnLoad('jump', a); });
loader.load('interact.fbx', (a) => { _OnLoad('interact', a); });
loader.load('defend.fbx', (a) => { _OnLoad('defend', a); });
loader.load('death.fbx', (a) => { _OnLoad('death', a); });
    });
  }

  _SetupCollisionDetection() {
    this._cube = this._CreateCube(); // Crear cubo y añadirlo a la escena

    // Agregar cubo a la escena
    this._params.scene.add(this._cube);
  }

  _CreateCube() {
    const cubeSize = 10;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, cubeSize / 2, -10); // Posición inicial del cubo
    cube.castShadow = true;
    cube.receiveShadow = true;
    return cube;
  }

  Update(timeInSeconds) {
    if (!this._target) {
      return;
    }

    this._stateMachine.Update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const framedeceleration = new THREE.Vector3(
        velocity.x * this._deceleration.x,
        velocity.y * this._deceleration.y,
        velocity.z * this._deceleration.z
    );
    framedeceleration.multiplyScalar(timeInSeconds);
    framedeceleration.z = Math.sign(framedeceleration.z) * Math.min(
        Math.abs(framedeceleration.z), Math.abs(velocity.z));

    velocity.add(framedeceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(3.0);
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
};

class BasicCharacterControllerInput {
  constructor() {
    this._Init();    
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      key1: false,   // Nueva tecla 1
      key2: false,   // Nueva tecla 2
      key3: false,   // Nueva tecla 3
      key4: false,   // Nueva tecla 4
      key5: false    // Nueva tecla 5
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
      case 49: // 1
        this._keys.key1 = true;
        break;
      case 50: // 2
        this._keys.key2 = true;
        break;
      case 70: // 3
        this._keys.key3 = true;
        break;
      case 71: // 4
        this._keys.key4 = true;
        break;
      case 72: // 5
        this._keys.key5 = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch(event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
      case 49: // 1
        this._keys.key1 = false;
        break;
      case 50: // 2
        this._keys.key2 = false;
        break;
      case 70: // 3
        this._keys.key3 = false;
        break;
      case 71: // 4
        this._keys.key4 = false;
        break;
      case 72: // 5
        this._keys.key5 = false;
        break;
    }
  }
};



class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;
    
    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
};


class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
    this._AddState('run', RunState);
    this._AddState('attack', AttackState);
    this._AddState('jump', JumpState);
    this._AddState('interact', InteractState);
    this._AddState('defend', DefendState);
    this._AddState('death', DeathState);
  }
}

class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() {}
  Exit() {}
  Update() {}
}

class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'walk';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['walk'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'run') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState('run');
      }
      return;
    }

    if (input._keys.space) {
      this._parent.SetState('jump');
      return;
    }

    if (input._keys.key1) {
      this._parent.SetState('attack');
      return;
    }

    if (input._keys.key2) {
      this._parent.SetState('interact');
      return;
    }

    this._parent.SetState('idle');
  }
}

class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'run';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['run'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'walk') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState('walk');
      }
      return;
    }

    if (input._keys.space) {
      this._parent.SetState('jump');
      return;
    }

    if (input._keys.key1) {
      this._parent.SetState('attack');
      return;
    }

    if (input._keys.key2) {
      this._parent.SetState('interact');
      return;
    }

    this._parent.SetState('idle');
  }
}

class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'idle';
  }

  Enter(prevState) {
    const idleAction = this._parent._proxy._animations['idle'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk');
      return;
    }

    if (input._keys.space) {
      this._parent.SetState('jump');
      return;
    }

    if (input._keys.key1) {
      this._parent.SetState('attack');
      return;
    }

    if (input._keys.key2) {
      this._parent.SetState('interact');
      return;
    }
  }
}

class AttackState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'attack';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['attack'].action;
    curAction.enabled = true;
    curAction.time = 0.0;
    curAction.setEffectiveTimeScale(1.0);
    curAction.setEffectiveWeight(1.0);
    curAction.play();
  }

  Exit() {}

  Update(_, input) {
    if (!input._keys.key1) {
      this._parent.SetState('idle');
    }
  }
}

class JumpState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'jump';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['jump'].action;
    curAction.enabled = true;
    curAction.time = 0.0;
    curAction.setEffectiveTimeScale(1.0);
    curAction.setEffectiveWeight(1.0);
    curAction.play();
  }

  Exit() {}

  Update(_, input) {
    if (!input._keys.space) {
      this._parent.SetState('idle');
    }
  }
}

class InteractState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'interact';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['interact'].action;
    curAction.enabled = true;
    curAction.time = 0.0;
    curAction.setEffectiveTimeScale(1.0);
    curAction.setEffectiveWeight(1.0);
    curAction.play();
  }

  Exit() {}

  Update(_, input) {
    if (!input._keys.key2) {
      this._parent.SetState('idle');
    }
  }
}

class DefendState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'defend';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['defend'].action;
    curAction.enabled = true;
    curAction.time = 0.0;
    curAction.setEffectiveTimeScale(1.0);
    curAction.setEffectiveWeight(1.0);
    curAction.play();
  }

  Exit() {}

  Update(_, input) {
    console.log('DefendState Update');
    console.log('_keys.key3:', input._keys.key3);

    if (!input._keys.key3) {
      this._parent.SetState('idle');
    }
  }
}


class DeathState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'death';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['death'].action;
    curAction.enabled = true;
    curAction.time = 0.0;
    curAction.setEffectiveTimeScale(1.0);
    curAction.setEffectiveWeight(1.0);
    curAction.play();
  }

  Exit() {}

  Update(_, input) {
    console.log('DeathState Update');
    console.log('_keys.key4:', input._keys.key4);

    if (!input._keys.key4) {
      // Example logic: Respawn or go to game over screen
      // this._parent.Respawn(); // Example respawn method
      // Or navigate to game over screen
      // this._parent.GameOver();
    }
  }
}


class CharacterControllerDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  
    document.body.appendChild(this._threejs.domElement);
  
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);
  
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);
  
    this._scene = new THREE.Scene();
    
    // Añadir neblina
    const fogColor = new THREE.Color(0x1a1a1f); // Color de la neblina (blanco en este caso)
    const fogNear = 1; // Inicio de la neblina
    const fogFar = 100; // Final de la neblina
    this._scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
  
    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this._scene.add(light);
  
    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this._scene.add(light);
  
    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 10, 0);
    controls.update();
  
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000, 100, 100),
        new THREE.MeshStandardMaterial({
            color: 0x2023f5,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);
  
    this._mixers = [];
    this._previousRAF = null;
  
    this._LoadAnimatedModel();
    this._RAF();
  }

  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    }
    this._controls = new BasicCharacterController(params);
  }

  _LoadAnimatedModelAndPlay(path, modelFile, animFile, offset) {
    const loader = new FBXLoader();
    loader.setPath(path);
    loader.load(modelFile, (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse(c => {
        c.castShadow = true;
      });
      fbx.position.copy(offset);

      const anim = new FBXLoader();
      anim.setPath(path);
      anim.load(animFile, (anim) => {
        const m = new THREE.AnimationMixer(fbx);
        this._mixers.push(m);
        const idle = m.clipAction(anim.animations[0]);
        idle.play();
      });
      this._scene.add(fbx);
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }

    
  }
  
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new CharacterControllerDemo();
});
