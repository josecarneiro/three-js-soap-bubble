import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import FresnelShader from "./fresnel-shader";

const container: HTMLElement = document.getElementById("app") as HTMLElement;
let scene: any;
let camera: any;
let renderer: any;
let controls: any;
let refractSphereCamera: any;
let sphere: any;

const textureLoader = new THREE.TextureLoader();
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
const VIEW_ANGLE = 45;
const ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
const NEAR = 0.1;
const FAR = 20000;

function init() {
  // SCENE
  scene = new THREE.Scene();

  // CAMERA
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0, 150, 400);
  camera.lookAt(scene.position);

  // RENDERER
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container.appendChild(renderer.domElement);

  // CONTROLS
  controls = new OrbitControls(camera, renderer.domElement);

  // LIGHT
  const light = new THREE.PointLight(0xffffff);
  light.position.set(0, 250, 0);
  scene.add(light);

  // FLOOR
  const CHECKBOARD_IMAGE_PATH =
    "http://stemkoski.github.io/Three.js/images/checkerboard.jpg";
  const floorTexture = new THREE.TextureLoader().load(CHECKBOARD_IMAGE_PATH);
  Object.assign(floorTexture, {
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping
  });
  floorTexture.repeat.set(10, 10);
  /*
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0xaa6dcd,
    side: THREE.DoubleSide
  });
  */
  const floorMaterial = new THREE.MeshBasicMaterial({
    map: floorTexture,
    side: THREE.DoubleSide
  });
  const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -50.5;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);

  // SKYBOX
  // const imagePrefix = "images/dawnmountain-";
  const imagePrefix =
    "http://stemkoski.github.io/Three.js/images/dawnmountain-";
  const directions = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
  const extension = "png";

  const materialArray = directions
    .map((direction) => `${imagePrefix}${direction}.${extension}`)
    .map(
      (url) =>
        new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load(url),
          side: THREE.BackSide
        })
    );
  const skyGeometry = new THREE.BoxGeometry(5000, 5000, 5000);
  const skyBox = new THREE.Mesh(skyGeometry, materialArray);
  scene.add(skyBox);

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  refractSphereCamera = new THREE.CubeCamera(0.1, 5000, cubeRenderTarget);
  scene.add(refractSphereCamera);

  const fresnelUniforms = {
    mRefractionRatio: { type: "f", value: 1.03 },
    mFresnelBias: { type: "f", value: 0.1 },
    mFresnelPower: { type: "f", value: 2.0 },
    mFresnelScale: { type: "f", value: 1.0 },
    tCube: { type: "t", value: refractSphereCamera.renderTarget } //  textureCube }
  };

  const customMaterial = new THREE.ShaderMaterial({
    uniforms: fresnelUniforms,
    vertexShader: FresnelShader.vertexShader,
    fragmentShader: FresnelShader.fragmentShader
  });
  const sphereGeometry = new THREE.SphereGeometry(100, 64, 32);
  sphere = new THREE.Mesh(sphereGeometry, customMaterial);
  sphere.position.set(0, 50, 100);

  scene.add(sphere);

  // refractSphereCamera.position = sphere.position;
}

function update() {
  controls.update();
}

function render() {
  sphere.visible = false;
  refractSphereCamera.updateCubeMap(renderer, scene);
  sphere.visible = true;

  renderer.render(scene, camera);
}

function animate(timestamp: number = 0) {
  update();
  render();
  window.requestAnimationFrame(animate);
}

init();
animate();
