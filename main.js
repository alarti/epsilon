import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { AIDirector } from './ai-director.js';

// --- DOM & State ---
const hudTime = document.getElementById('hud-time');
const doorOverlay = document.getElementById('door-overlay');
const doorButtons = document.querySelectorAll('.door-choice');

const gameState = {
  time: 0,
  health: 100,
  keys: 0,
};

// --- PHYSICS SETUP ---
const physicsWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -20, 0), // Stronger gravity
});

const groundMaterial = new CANNON.Material('ground');
const playerMaterial = new CANNON.Material('player');
const playerGroundContactMaterial = new CANNON.ContactMaterial(
  groundMaterial,
  playerMaterial,
  {
    friction: 0.1,
    restitution: 0.2,
  }
);
physicsWorld.addContactMaterial(playerGroundContactMaterial);


// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const container = document.getElementById('game-container');
if (!container) {
  throw new Error('Game container not found');
}

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- PLAYER AND CONTROLS ---
const player = {
  mesh: new THREE.Mesh(
    new THREE.SphereGeometry(2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  ),
  body: new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(2),
    position: new CANNON.Vec3(0, 10, 0),
    material: playerMaterial,
  }),
  speed: 20.0,
  turnSpeed: 2.0,
};
physicsWorld.addBody(player.body);
scene.add(player.mesh);

const keyboardState = {};
window.addEventListener('keydown', (e) => { keyboardState[e.code] = true; });
window.addEventListener('keyup', (e) => { keyboardState[e.code] = false; });

// --- CHUNK AND TERRAIN MANAGEMENT ---
const terrainWorker = new Worker('./terrain-worker.js', { type: 'module' });
const chunks = new Map();

const CHUNK_SIZE = 100;
const CHUNK_SEGMENTS = 50;
const terrainParams = {
  width: CHUNK_SIZE,
  height: CHUNK_SIZE,
  segments: CHUNK_SEGMENTS,
  scale: 0.1,
  amplitude: 15,
};

function generateChunks() {
  const CHUNK_GRID_RADIUS = 1; // Creates a 3x3 grid (2*1+1)
  for (let x = -CHUNK_GRID_RADIUS; x <= CHUNK_GRID_RADIUS; x++) {
    for (let z = -CHUNK_GRID_RADIUS; z <= CHUNK_GRID_RADIUS; z++) {
      const chunkId = `${x},${z}`;
      if (!chunks.has(chunkId)) {
        terrainWorker.postMessage({
          ...terrainParams,
          offsetX: x * CHUNK_SIZE,
          offsetZ: z * CHUNK_SIZE,
        });
      }
    }
  }
}

terrainWorker.onmessage = (event) => {
  const { heightmap, offsetX, offsetZ } = event.data;
  const chunkId = `${offsetX / CHUNK_SIZE},${offsetZ / CHUNK_SIZE}`;

  const geometry = new THREE.PlaneGeometry(
    terrainParams.width,
    terrainParams.height,
    terrainParams.segments,
    terrainParams.segments
  );
  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < heightmap.length; i++) {
    vertices[i * 3 + 1] = heightmap[i];
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
  const terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.position.set(offsetX, 0, offsetZ);
  scene.add(terrainMesh);

  // Create physics body for the terrain chunk
  const heightfieldData = transpose(to2DArray(heightmap, CHUNK_SEGMENTS + 1));
  const heightfieldShape = new CANNON.Heightfield(
    heightfieldData,
    { elementSize: CHUNK_SIZE / CHUNK_SEGMENTS }
  );
  const terrainBody = new CANNON.Body({ mass: 0, material: groundMaterial });
  terrainBody.addShape(heightfieldShape);
  // Position the heightfield so its corner aligns with the visual mesh's corner.
  // With the data transposed, this alignment should now be correct.
  terrainBody.position.set(offsetX - CHUNK_SIZE / 2, 0, offsetZ - CHUNK_SIZE / 2);

  physicsWorld.addBody(terrainBody);
  console.log(`Created chunk ${chunkId} at visual:(${offsetX},0,${offsetZ}), physics:(${terrainBody.position.x},0,${terrainBody.position.z})`);

  chunks.set(chunkId, { mesh: terrainMesh, body: terrainBody });
};

// Helper to convert 1D heightmap to 2D array for Cannon.js
function to2DArray(arr, size) {
  const newArr = [];
  for (let i = 0; i < size; i++) {
    newArr.push(arr.slice(i * size, i * size + size));
  }
  return newArr;
}

// Helper to transpose a 2D array (swap rows and columns)
function transpose(matrix) {
    if (!matrix || matrix.length === 0) {
        return [];
    }
    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed = [];
    for (let j = 0; j < cols; j++) {
        transposed[j] = [];
        for (let i = 0; i < rows; i++) {
            transposed[j][i] = matrix[i][j];
        }
    }
    return transposed;
}

// Initial generation
generateChunks();
// Adjust camera for the new larger world
camera.position.set(0, 80, 150);
camera.lookAt(0, 0, 0);


// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// The scene is empty until the terrain is generated by the worker.

// --- GAME LOOP LOGIC ---
const goal = new THREE.Mesh(
  new THREE.TorusKnotGeometry(5, 1.5, 100, 16),
  new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x333300 })
);
// Place goal on the furthest chunk
goal.position.set(0, 10, -1 * CHUNK_SIZE);
scene.add(goal);

function resetLevel() {
  // Reset physics body
  player.body.position.set(0, 10, 0);
  player.body.velocity.set(0, 0, 0);
  player.body.angularVelocity.set(0, 0, 0);
  player.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);

  // Reset game state
  gameState.time = 0;
  doorOverlay.classList.add('hidden');
}

// This function will now apply the AI's parameters
function applyRunParameters(params) {
  // Mutate visual theme
  if (params.visualTheme.fog) {
    const { color, near, far } = params.visualTheme.fog;
    scene.fog = new THREE.Fog(color, near, far);
    renderer.setClearColor(scene.fog.color); // Match background to fog
  } else {
    scene.fog = null;
    renderer.setClearColor(scene.background);
  }

  // Mutate gameplay parameters
  const delta = params.difficultyDelta;
  player.speed = 20.0 * delta;
  terrainParams.amplitude = 15.0 * delta;
  console.log(`Difficulty delta ${delta} applied. New speed: ${player.speed}, New amplitude: ${terrainParams.amplitude}`);
}


doorButtons.forEach(button => {
  button.addEventListener('click', async () => {
    // Prevent multiple clicks
    doorOverlay.style.pointerEvents = 'none';

    const difficulty = button.dataset.difficulty;

    // Call the AI director
    const nextRunParams = await AIDirector.getRunParameters(gameState, difficulty);
    console.log('AI Director returned:', nextRunParams);

    // Apply the new parameters
    applyRunParameters(nextRunParams);

    // Reset the level for the new run
    resetLevel();
    doorOverlay.style.pointerEvents = 'auto';
  });
});


// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  // --- Step Physics World ---
  physicsWorld.step(1 / 60, deltaTime, 3);

  // --- Player Controls (now physics-based) ---
  const moveSpeed = player.speed;
  const turnSpeed = player.turnSpeed;

  // Forward/backward velocity
  if (keyboardState['KeyW']) {
    const forward = new CANNON.Vec3();
    player.body.quaternion.vmult(new CANNON.Vec3(0, 0, -1), forward);
    player.body.velocity.x = forward.x * moveSpeed;
    player.body.velocity.z = forward.z * moveSpeed;
  } else if (keyboardState['KeyS']) {
    const forward = new CANNON.Vec3();
    player.body.quaternion.vmult(new CANNON.Vec3(0, 0, 1), forward);
    player.body.velocity.x = forward.x * moveSpeed;
    player.body.velocity.z = forward.z * moveSpeed;
  } else {
    player.body.velocity.x *= 0.9; // some damping
    player.body.velocity.z *= 0.9;
  }

  // Turning (angular velocity)
  if (keyboardState['KeyA']) {
    player.body.angularVelocity.y = turnSpeed;
  } else if (keyboardState['KeyD']) {
    player.body.angularVelocity.y = -turnSpeed;
  } else {
    player.body.angularVelocity.y = 0;
  }

  // --- Link Physics to Graphics ---
  player.mesh.position.copy(player.body.position);
  player.mesh.quaternion.copy(player.body.quaternion);

  // --- Camera follow ---
  const idealOffset = new THREE.Vector3(0, 15, 30); // Behind, up, and away
  idealOffset.applyQuaternion(player.mesh.quaternion);

  const cameraTargetPosition = player.mesh.position.clone().add(idealOffset);
  camera.position.lerp(cameraTargetPosition, 0.1);

  const lookAtTarget = player.mesh.position.clone().add(new THREE.Vector3(0, 2, 0));
  camera.lookAt(lookAtTarget);

  // --- HUD Update ---
  gameState.time += deltaTime;
  hudTime.textContent = `Time: ${gameState.time.toFixed(1)}s`;

  // --- Goal Animation and Collision ---
  goal.rotation.y += 1 * deltaTime;
  goal.rotation.z += 0.5 * deltaTime;

  if (player.body.position.distanceTo(goal.position) < 10) {
    doorOverlay.classList.remove('hidden');
  }

  renderer.render(scene, camera);
}

animate();

// --- RESIZE HANDLER ---
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);
