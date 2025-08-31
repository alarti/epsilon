// --- Pollination Engine v1 ---
// Responsable de la generación y evolución de genomas de organismos.

// Lista de posibles componentes celulares y sus descripciones en español.
const COMPONENT_POOL = [
    {
        name: "Núcleo",
        description: "Controla la célula y contiene el material genético (ADN)."
    },
    {
        name: "Membrana Plasmática",
        description: "Capa externa que protege la célula y regula el paso de sustancias."
    },
    {
        name: "Citoplasma",
        description: "Sustancia gelatinosa que llena la célula y alberga los orgánulos."
    },
    {
        name: "Mitocondria",
        description: "Produce la mayor parte de la energía de la célula (ATP)."
    },
];

/**
 * Genera un genoma aleatorio para un nuevo organismo unicelular.
 * @returns {object} Un objeto JSON que representa el genoma del organismo.
 */
export function generateGenome() {
    // Genera un color hexadecimal aleatorio
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

    // Selecciona un subconjunto aleatorio de componentes
    const numComponents = Math.floor(Math.random() * (COMPONENT_POOL.length)) + 1;
    const shuffledComponents = COMPONENT_POOL.sort(() => 0.5 - Math.random());
    const selectedComponents = shuffledComponents.slice(0, numComponents);

    return {
        id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        size: Math.random() * 0.5 + 0.2, // Radio entre 0.2 y 0.7
        color: randomColor,
        components: selectedComponents,
        lifespan: Math.random() * 15 + 10, // Lifespan between 10 and 25 seconds
    };
}

/**
 * Muta un genoma para crear una nueva variante.
 * @param {object} parentGenome - El genoma del padre.
 * @returns {object} Un nuevo genoma mutado.
 */
function mutate(parentGenome) {
    const mutationRate = 0.2; // Probabilidad de que ocurra una mutación

    // Mutar tamaño
    let newSize = parentGenome.size;
    if (Math.random() < mutationRate) {
        newSize += (Math.random() - 0.5) * 0.1;
        newSize = Math.max(0.1, Math.min(newSize, 1.0)); // Clamp size
    }

    // Mutar color
    let newColor = parentGenome.color;
    if (Math.random() < mutationRate) {
        const colorVal = parseInt(parentGenome.color.slice(1), 16);
        const mutation = Math.floor((Math.random() - 0.5) * 50);
        const newColorVal = Math.max(0, Math.min(0xFFFFFF, colorVal + mutation));
        newColor = '#' + newColorVal.toString(16).padStart(6, '0');
    }

    // Mutar lifespan
    let newLifespan = parentGenome.lifespan;
    if (Math.random() < mutationRate) {
        newLifespan += (Math.random() - 0.5) * 2; // Change by up to +/- 1 second
        newLifespan = Math.max(5, newLifespan); // Minimum lifespan of 5 seconds
    }

    return {
        ...parentGenome, // Hereda componentes y otros rasgos
        id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        size: newSize,
        color: newColor,
        lifespan: newLifespan,
    };
}

/**
 * Helper function to mix two hex colors.
 * @param {string} colorA - e.g., "#RRGGBB"
 * @param {string} colorB - e.g., "#RRGGBB"
 * @returns {string} The mixed hex color.
 */
function mixColors(colorA, colorB) {
    const cA = parseInt(colorA.slice(1), 16);
    const cB = parseInt(colorB.slice(1), 16);

    const rA = (cA >> 16) & 0xff;
    const gA = (cA >> 8) & 0xff;
    const bA = cA & 0xff;

    const rB = (cB >> 16) & 0xff;
    const gB = (cB >> 8) & 0xff;
    const bB = cB & 0xff;

    const r = Math.floor((rA + rB) / 2);
    const g = Math.floor((gA + gB) / 2);
    const b = Math.floor((bA + bB) / 2);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
}


/**
 * Combines the genomes of two parents to create a new offspring (sexual reproduction).
 * @param {object} genomeA - The first parent's genome.
 * @param {object} genomeB - The second parent's genome.
 * @returns {object} The new child's genome.
 */
export function crossover(genomeA, genomeB) {
    const childGenome = {
        id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        size: (genomeA.size + genomeB.size) / 2,
        color: mixColors(genomeA.color, genomeB.color),
        lifespan: (genomeA.lifespan + genomeB.lifespan) / 2,
        // Inherit components from one parent at random
        components: Math.random() < 0.5 ? genomeA.components : genomeB.components,
    };

    // The child has a chance to mutate
    return mutate(childGenome);
}

/**
 * Evoluciona una población de genomas a la siguiente generación.
 * @param {Array<object>} parentGenomes - Un array de los genomas de la generación actual.
 * @returns {Array<object>} Un array de los nuevos genomas de la siguiente generación.
 */
export function evolve(parentGenomes) {
    if (parentGenomes.length === 0) {
        return [];
    }

    // Simple "asexual reproduction" with mutation
    const newGenomes = parentGenomes.map(parent => mutate(parent));

    return newGenomes;
}

/**
 * Simulates a massive jump in generations by creating a new random variant.
 * Over a vast number of generations, the link to the original ancestor's specific
 * size and color is effectively lost due to continuous random mutations.
 * @param {object} parentGenome - The starting genome.
 * @param {number} generations - The number of generations to jump.
 * @returns {object} A new, drastically evolved genome.
 */
export function megaEvolve(parentGenome, generations) {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

    // The new size is completely random, as 100,000 generations of mutation
    // would likely explore the entire possible range of sizes.
    const newSize = Math.random() * 0.5 + 0.2; // Radius between 0.2 and 0.7
    const newLifespan = Math.random() * 15 + 10;

    return {
        ...parentGenome, // Inherit stable traits like components
        id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        size: newSize,
        color: randomColor,
        lifespan: newLifespan,
    };
}
