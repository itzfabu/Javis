// Shared helpers for all six Thread 3 archetype template scenes. Kept as one
// small file rather than duplicated per scene - the six scenes differ in
// geometry/camera path (the actual template content), not in scene setup,
// param parsing, or logo compositing, so that part is factored out once.
window.__logoReady = true; // flipped to false/true around async texture loads in makeLogoPlane when a logoAsset is used

window.FrameScene = (function () {
  function parseParams() {
    const q = new URLSearchParams(location.search);
    return {
      w: parseInt(q.get('w') || '600', 10),
      h: parseInt(q.get('h') || '600', 10),
      primary: '#' + (q.get('primary') || 'C4622D'),
      accent: '#' + (q.get('accent') || 'E8A23D'),
      tertiary: '#' + (q.get('tertiary') || q.get('primary') || 'C4622D'),
      bg: '#' + (q.get('bg') || 'FBF6EF'),
      logoText: q.get('logoText') || '',
      logoAsset: q.get('logoAsset') || '',
      logoFraction: q.get('logoFraction') !== null ? parseFloat(q.get('logoFraction')) : 1.0,
    };
  }

  function setupBasic(P) {
    const canvas = document.getElementById('c');
    canvas.width = P.w;
    canvas.height = P.h;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(P.w, P.h, false);
    renderer.setPixelRatio(1);
    renderer.localClippingEnabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(P.bg);

    const camera = new THREE.PerspectiveCamera(35, P.w / P.h, 0.1, 100);
    return { renderer, scene, camera };
  }

  // Three-light rig validated in the original SPIN spike (hemisphere fill +
  // key + rim). NOTE (disclosed divergence): this does not port the fuller
  // HDRI + PBR + EffectComposer bloom chain described elsewhere in this
  // document's Visual Richness section for the *live* interactive 3D hero -
  // no HDRI asset ships with this repo, and building/sourcing one is a
  // separate task from the pipeline plumbing this build delivers. See the
  // vault writeup's divergence note.
  function addThreeLightRig(scene) {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2, 3, 2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(-2, 1, -2);
    scene.add(rim);
  }

  // Logo compositing: a plane textured either with the client's reviewed
  // logo image (P.logoAsset) or a text-wordmark canvas fallback (P.logoText).
  // Per Thread 3 Recommendation #4, this only ever receives an asset the
  // caller has already confirmed passed the Thread 1 review gate - this
  // function has no opinion on review status, it just draws what it's given.
  function makeLogoPlane(P, width, height) {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const geo = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.ready = false;

    if (P.logoAsset) {
      window.__logoReady = false; // capture.js waits on this before screenshotting any frame
      const loader = new THREE.TextureLoader();
      loader.load(P.logoAsset, (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
        mesh.userData.ready = true;
        window.__logoReady = true;
      });
    } else if (P.logoText) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = P.primary;
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(P.logoText, 256, 128);
      mat.map = new THREE.CanvasTexture(c);
      mat.needsUpdate = true;
      mesh.userData.ready = true;
    }
    // No asset and no text at all: mesh stays present but fully transparent
    // (opacity never leaves 0) - matches Thread 1's "composites nothing" case.
    return mesh;
  }

  // Fades the logo plane in over a short window ending at P.logoFraction,
  // e.g. appearsAtFrameFraction: 1.0 means "fully visible by the final frame".
  function updateLogoOpacity(mesh, P, t) {
    if (!mesh.userData.ready) return;
    const fadeWindow = 0.12;
    const start = Math.max(0, P.logoFraction - fadeWindow);
    let opacity;
    if (t <= start) opacity = 0;
    else if (t >= P.logoFraction) opacity = 1;
    else opacity = (t - start) / (P.logoFraction - start);
    mesh.material.opacity = opacity;
  }

  // Frustum regression guard: projects every corner of the logo mesh's
  // world-space bounding box through the camera into NDC space and checks
  // each lands within [-bound, bound] on x/y (bound = 1 - margin) and within
  // [-1, 1] on z (in front of the camera, not behind it). Catches exactly
  // the class of bug found during this project's own testing (a signboard
  // positioned outside the visible frame, discovered only by looking at a
  // rendered screenshot) automatically, on every capture run, instead of
  // relying on a human noticing a blank/clipped logo in a spot-check.
  const FRUSTUM_MARGIN_NDC = 0.05;

  function checkFrustum(camera, mesh, margin) {
    margin = margin != null ? margin : FRUSTUM_MARGIN_NDC;
    camera.updateMatrixWorld(true);
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    const corners = [
      [box.min.x, box.min.y, box.min.z], [box.min.x, box.min.y, box.max.z],
      [box.min.x, box.max.y, box.min.z], [box.min.x, box.max.y, box.max.z],
      [box.max.x, box.min.y, box.min.z], [box.max.x, box.min.y, box.max.z],
      [box.max.x, box.max.y, box.min.z], [box.max.x, box.max.y, box.max.z],
    ].map((c) => new THREE.Vector3(c[0], c[1], c[2]));

    const bound = 1 - margin;
    let ok = true;
    const projected = corners.map((c) => {
      const p = c.clone().project(camera);
      const within = p.x >= -bound && p.x <= bound && p.y >= -bound && p.y <= bound && p.z >= -1 && p.z <= 1;
      if (!within) ok = false;
      return { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3), within };
    });
    return { ok, margin, bound, corners: projected };
  }

  return { parseParams, setupBasic, addThreeLightRig, makeLogoPlane, updateLogoOpacity, checkFrustum, FRUSTUM_MARGIN_NDC };
})();
