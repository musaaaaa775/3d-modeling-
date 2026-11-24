import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. ADD YOUR 3D PROJECTS HERE
const PROJECTS = [
  {
    name: 'Rocket v1',
    description: 'Orbital Rocket — Work in Progress',
    file: 'models/rocket.glb' // Upload your file here when ready!
  },
  {
    name: 'Project 2',
    description: 'Add your second 3D model here',
    file: 'models/project2.glb'
  }
];

// 2. SCENE, CAMERA & RENDERER SETUP
const canvas = document.getElementById('scene-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b12);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. TOUCH & MOUSE CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;

// 4. LIGHTING & FLOOR GRID
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(5, 8, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
rimLight.position.set(-5, 3, -5);
scene.add(rimLight);

const grid = new THREE.GridHelper(12, 24, 0x334155, 0x1e293b);
scene.add(grid);

// 5. MODEL LOADER & PLACEHOLDER ROCKET
const loader = new GLTFLoader();
let currentModel = null;
let wireframeMode = false;

function createPlaceholderRocket() {
  const rocket = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.3 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.4, 24), bodyMat);
  body.position.y = 1.4;
  rocket.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 24), accentMat);
  nose.position.y = 3.05;
  rocket.add(nose);

  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.5), accentMat);
    const angle = (i * Math.PI) / 2;
    fin.position.set(Math.cos(angle) * 0.5, 0.55, Math.sin(angle) * 0.5);
    fin.rotation.y = -angle;
    rocket.add(fin);
  }
  return rocket;
}

function setModel(object) {
  if (currentModel) scene.remove(currentModel);
  currentModel = object;

  // Auto-center and scale model to fit screen nicely
  const box = new THREE.Box3().setFromObject(currentModel);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());

  currentModel.position.sub(center);
  currentModel.position.y += (box.max.y - box.min.y) / 2;
  if (size > 0) currentModel.scale.multiplyScalar(3.5 / size);

  applyWireframe(wireframeMode);
  scene.add(currentModel);
}

function loadProject(index, buttonEl) {
  const project = PROJECTS[index];
  document.getElementById('model-info').textContent = project.description;

  document.querySelectorAll('.project-bar button').forEach(b => b.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');

  loader.load(
    project.file,
    (gltf) => setModel(gltf.scene),
    undefined,
    () => {
      // If .glb isn't uploaded yet, show the built-in placeholder rocket
      setModel(createPlaceholderRocket());
    }
  );
}

// 6. UI BUTTONS & PROJECT SWITCHER
const projectBar = document.getElementById('project-bar');
PROJECTS.forEach((proj, idx) => {
  const btn = document.createElement('button');
  btn.textContent = proj.name;
  if (idx === 0) btn.classList.add('active');
  btn.onclick = () => loadProject(idx, btn);
  projectBar.appendChild(btn);
});

function applyWireframe(enabled) {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.wireframe = enabled;
    }
  });
}

document.getElementById('wireframe-btn').onclick = (e) => {
  wireframeMode = !wireframeMode;
  e.target.textContent = `Wireframe: ${wireframeMode ? 'ON' : 'OFF'}`;
  e.target.classList.toggle('active', wireframeMode);
  applyWireframe(wireframeMode);
};

document.getElementById('spin-btn').onclick = (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.target.textContent = `Auto-Spin: ${controls.autoRotate ? 'ON' : 'OFF'}`;
  e.target.classList.toggle('active', controls.autoRotate);
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start with first project & animation loop
loadProject(0);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
