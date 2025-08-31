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

    return {
        ...parentGenome, // Hereda componentes y otros rasgos
        id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        size: newSize,
        color: newColor,
    };
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
