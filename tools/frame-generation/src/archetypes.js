// Archetype registry for Thread 3 frame generation. Each entry maps one of
// the six archetypes (per vault/Projects/Website Generator.md, Visual
// Richness > Archetype library) to its template scene file, native aspect
// ratio, frame count, and output resolution.
//
// Resolution rule: long edge fixed at 1200px, matching the one concretely
// tested/recommended number in the vault note's sprite-scaling resolution
// (ASSEMBLE's "2x (recommended): 800x1200/frame"). The short edge is derived
// from each archetype's native aspect ratio. This generalizes the one
// validated number rather than inventing an unrelated one, but only
// ASSEMBLE's own 800x1200 was independently measured - the other five are a
// disclosed generalization, not separately re-verified.
//
// Frame counts: ASSEMBLE (96) and SPIN (24) trace to prior spikes
// (flipbook-scale/flipbook-scrub and this project's own template_spin.py /
// scene.html respectively). REVEAL/TRANSFORM/FLYTHROUGH/INTERFACE counts
// below are this build's own reasoned defaults, not independently tested -
// see the divergence note in the vault writeup. All are plain config here,
// safe to tune later without touching capture/composite logic.

const LONG_EDGE_2X = 1200;

function dimsFromRatio(wRatio, hRatio) {
  if (wRatio >= hRatio) {
    const w = LONG_EDGE_2X;
    const h = Math.round((LONG_EDGE_2X * hRatio) / wRatio);
    return { width: w, height: h };
  }
  const h = LONG_EDGE_2X;
  const w = Math.round((LONG_EDGE_2X * wRatio) / hRatio);
  return { width: w, height: h };
}

const ARCHETYPES = {
  ASSEMBLE: {
    scene: 'assemble.html',
    frameCount: 96,
    aspectRatio: [2, 3],
    dims: dimsFromRatio(2, 3), // 800x1200 - matches the tested/recommended figure exactly
    stylized: true, // per Recommendation #2: ships generic/disclosed-as-stylized by default; real capture is a paid add-on, out of this pipeline's scope
    stylizedNote: 'Template shows a generic assembling structure, not the client\'s actual building. Disclose to the client as a stylized representation; real photogrammetry capture is a separate, manually-scoped paid add-on (not produced by this pipeline).',
  },
  REVEAL: {
    scene: 'reveal.html',
    frameCount: 48,
    aspectRatio: [4, 5],
    dims: dimsFromRatio(4, 5),
    stylized: false,
  },
  SPIN: {
    scene: 'spin.html',
    frameCount: 24,
    aspectRatio: [1, 1],
    dims: dimsFromRatio(1, 1),
    stylized: false,
  },
  TRANSFORM: {
    scene: 'transform.html',
    frameCount: 32,
    aspectRatio: [3, 2],
    dims: dimsFromRatio(3, 2),
    stylized: false,
  },
  FLYTHROUGH: {
    scene: 'flythrough.html',
    frameCount: 72,
    aspectRatio: [16, 9],
    dims: dimsFromRatio(16, 9),
    stylized: true, // per Recommendation #2: same disclosed-stylized default as ASSEMBLE
    stylizedNote: 'Template shows a generic environment glide, not the client\'s actual space. Disclose to the client as a stylized representation; real photogrammetry capture is a separate, manually-scoped paid add-on (not produced by this pipeline).',
  },
  INTERFACE: {
    scene: 'interface.html',
    frameCount: 48,
    aspectRatio: [16, 9],
    dims: dimsFromRatio(16, 9),
    stylized: false,
  },
};

function getArchetype(name) {
  const key = (name || '').toUpperCase().trim();
  const entry = ARCHETYPES[key];
  if (!entry) {
    throw new Error(
      `Unknown archetype "${name}". Valid archetypes: ${Object.keys(ARCHETYPES).join(', ')}`
    );
  }
  return { key, ...entry };
}

module.exports = { ARCHETYPES, getArchetype, LONG_EDGE_2X };
