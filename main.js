import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { generateGenome, evolve, megaEvolve, crossover } from './pollination.js';

// --- DOM & State ---
const organisms = new Map();
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-content');
const evolveBtn = document.getElementById('evolve-btn');
const generationCountSpan = document.getElementById('generation-count');
const toggleInfoPanelBtn = document.getElementById('toggle-info-panel');
const toggleAutoEvolveBtn = document.getElementById('toggle-auto-evolve');

let generation = 1;
let autoEvolveInterval = null;
const clock = new THREE.Clock();
const REPRODUCTION_COOLDOWN = 4; // seconds
const SIZE_LIFESPAN_COST_FACTOR = 5; // Larger size reduces lifespan

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
const container = document.getElementById('game-container');

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- PHYSICS SETUP ---
const physicsWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Ground plane
const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // rotate to be horizontal
physicsWorld.addBody(groundBody);

const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);


// --- Organism Management ---
function createOrganismFromGenome(genome) {
    // Create physics body
    const body = new CANNON.Body({
        mass: genome.size * 10, // Mass proportional to size
        shape: new CANNON.Sphere(genome.size),
        position: new CANNON.Vec3(
            (Math.random() - 0.5) * 40,
            10,
            (Math.random() - 0.5) * 40
        ),
    });
    body.organismId = genome.id; // Add back-reference
    body.addEventListener('collide', handleCollision);
    physicsWorld.addBody(body);

    // Create visual mesh
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(genome.size, 16, 16),
        new THREE.MeshStandardMaterial({ color: genome.color })
    );
    mesh.castShadow = true;
    scene.add(mesh);

    // Store the organism
    const birthTime = clock.getElapsedTime();
    organisms.set(genome.id, {
        genome,
        body,
        mesh,
        birthTime,
        lastReproductionTime: -REPRODUCTION_COOLDOWN, // Ready to reproduce immediately
    });
}

function handleCollision(event) {
    const bodyA = event.body;
    const bodyB = event.target;

    const organismA = organisms.get(bodyA.organismId);
    const organismB = organisms.get(bodyB.organismId);

    // Ensure both organisms exist and we are not at max population
    if (!organismA || !organismB || organisms.size >= 50) {
        return;
    }

    const now = clock.getElapsedTime();
    // Check if both are ready to reproduce
    if (now - organismA.lastReproductionTime > REPRODUCTION_COOLDOWN &&
        now - organismB.lastReproductionTime > REPRODUCTION_COOLDOWN) {

        // They reproduce!
        const childGenome = crossover(organismA.genome, organismB.genome);
        createOrganismFromGenome(childGenome);

        // Update their cooldowns
        organismA.lastReproductionTime = now;
        organismB.lastReproductionTime = now;

        console.log(`Reproduction between ${organismA.genome.id.slice(-4)} and ${organismB.genome.id.slice(-4)}`);
    }
}

function createInitialPopulation() {
    for (let i = 0; i < 10; i++) {
        const genome = generateGenome();
        createOrganismFromGenome(genome);
    }
    console.log(`Created initial population of ${organisms.size} organisms.`);
}

function clearGeneration() {
    for (const organism of organisms.values()) {
        physicsWorld.removeBody(organism.body);
        scene.remove(organism.mesh);
        // It's good practice to dispose of geometries and materials
        organism.mesh.geometry.dispose();
        organism.mesh.material.dispose();
    }
    organisms.clear();
    updateInfoPanel(null); // Clear the info panel
}

function runMegaEvolution() {
    const parentGenomes = Array.from(organisms.values()).map(org => org.genome);
    if (parentGenomes.length === 0) return;

    // Use megaEvolve for a big jump
    const newGenomes = parentGenomes.map(parent => megaEvolve(parent, 1000));

    // clearGeneration(); // No longer clearing old generations
    newGenomes.forEach(genome => createOrganismFromGenome(genome));

    generation += 1000;
    // Format with commas
    generationCountSpan.textContent = generation.toLocaleString();
    console.log(`Mega-evolved to generation ${generation}.`);
}


// --- ANIMATION LOOP ---
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  // --- Cell Death Check ---
  const now = clock.getElapsedTime();
  const deadOrganisms = [];
  for (const [id, organism] of organisms.entries()) {
      const effectiveLifespan = organism.genome.lifespan - (organism.genome.size * SIZE_LIFESPAN_COST_FACTOR);
      if (now - organism.birthTime > effectiveLifespan) {
          deadOrganisms.push(id);
      }
  }

  deadOrganisms.forEach(id => {
      const organism = organisms.get(id);
      if (organism) {
          physicsWorld.removeBody(organism.body);
          scene.remove(organism.mesh);
          organism.mesh.geometry.dispose();
          organism.mesh.material.dispose();
          organisms.delete(id);
      }
  });


  // Step the physics world
  physicsWorld.step(1 / 60, deltaTime, 3);

  // Sync physics and graphics for each organism
  for (const organism of organisms.values()) {
      organism.mesh.position.copy(organism.body.position);
      organism.mesh.quaternion.copy(organism.body.quaternion);
  }

  // Render the scene
  renderer.render(scene, camera);
}

// Create the first organism
createInitialPopulation();

function startAutoEvolution() {
    if (autoEvolveInterval) return; // Already running
    autoEvolveInterval = setInterval(runMegaEvolution, 1000);
    toggleAutoEvolveBtn.dataset.state = 'running';
    toggleAutoEvolveBtn.textContent = 'Detener Auto-Evolución';
    evolveBtn.disabled = true;
}

function stopAutoEvolution() {
    if (!autoEvolveInterval) return; // Already stopped
    clearInterval(autoEvolveInterval);
    autoEvolveInterval = null;
    toggleAutoEvolveBtn.dataset.state = 'stopped';
    toggleAutoEvolveBtn.textContent = 'Iniciar Auto-Evolución';
    evolveBtn.disabled = false;
}

// --- UI Interaction ---
function updateInfoPanel(genome) {
    infoContent.innerHTML = ''; // Clear previous content
    if (!genome) {
        infoContent.innerHTML = '<p>Selecciona un organismo para ver sus detalles.</p>';
        return;
    }

    const title = document.createElement('h3');
    title.textContent = `ID: ${genome.id.split('-')[1]}`;
    infoContent.appendChild(title);

    const sizeP = document.createElement('p');
    sizeP.textContent = `Tamaño: ${genome.size.toFixed(2)}`;
    infoContent.appendChild(sizeP);

    const colorP = document.createElement('p');
    colorP.innerHTML = `Color: <span style="color:${genome.color};">${genome.color}</span>`;
    infoContent.appendChild(colorP);

    const componentsTitle = document.createElement('h4');
    componentsTitle.textContent = 'Componentes:';
    infoContent.appendChild(componentsTitle);

    genome.components.forEach(comp => {
        const compP = document.createElement('p');
        compP.innerHTML = `<strong>${comp.name}:</strong> ${comp.description}`;
        infoContent.appendChild(compP);
    });

    const dnaTitle = document.createElement('h4');
    dnaTitle.textContent = 'ADN (JSON)';
    dnaTitle.style.marginTop = '15px';
    infoContent.appendChild(dnaTitle);

    const pre = document.createElement('pre');
    pre.className = 'json-display';
    pre.textContent = JSON.stringify(genome, null, 2);
    infoContent.appendChild(pre);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    let organismClicked = false;
    for (const intersect of intersects) {
        for (const organism of organisms.values()) {
            if (organism.mesh === intersect.object) {
                updateInfoPanel(organism.genome);
                organismClicked = true;
                break;
            }
        }
        if (organismClicked) break;
    }

    if (!organismClicked && !event.target.closest('.panel-toggle-btn')) {
        updateInfoPanel(null);
    }
});

toggleInfoPanelBtn.addEventListener('click', () => {
    infoPanel.classList.toggle('hidden');
    const isHidden = infoPanel.classList.contains('hidden');
    if (isHidden) {
        toggleInfoPanelBtn.innerHTML = '&lt;'; // Show "open" symbol
        toggleInfoPanelBtn.style.right = '20px';
    } else {
        toggleInfoPanelBtn.innerHTML = '&gt;'; // Show "close" symbol
        toggleInfoPanelBtn.style.right = '280px';
    }
});

evolveBtn.addEventListener('click', () => {
    // 1. Get current generation's genomes
    const parentGenomes = Array.from(organisms.values()).map(org => org.genome);
    if (parentGenomes.length === 0) return;

    // 2. Evolve them to get new genomes
    const newGenomes = evolve(parentGenomes);

    // 3. Clear the old generation
    // clearGeneration(); // No longer clearing old generations

    // 4. Create the new generation
    newGenomes.forEach(genome => createOrganismFromGenome(genome));

    // 5. Update generation counter
    generation++;
    generationCountSpan.textContent = generation.toLocaleString();
    console.log(`Evolved to generation ${generation}. Population: ${organisms.size}`);
});

toggleAutoEvolveBtn.addEventListener('click', () => {
    const currentState = toggleAutoEvolveBtn.dataset.state;
    if (currentState === 'stopped') {
        startAutoEvolution();
    } else {
        stopAutoEvolution();
    }
});

animate();

// --- STARTUP LOGIC ---
startAutoEvolution();

// --- RESIZE HANDLER ---
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

console.log("Simulador de Evolución 3D inicializado.");
