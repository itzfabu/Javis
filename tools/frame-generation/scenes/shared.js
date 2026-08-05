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
    // alpha:true doesn't change normal rendering (scene.background stays opaque, so the canvas's
    // alpha channel is 255 everywhere during a real capture) - it only makes a transparent clear
    // available, which the occlusion guard's isolated-render pass below needs.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
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
      loader.load(
        P.logoAsset,
        (tex) => {
          const img = tex.image;
          if (!img || !img.naturalWidth || !img.naturalHeight) {
            // Loads "successfully" (onLoad fires) but decodes to zero pixels - the known failure
            // mode for an SVG whose root element has no width/height/viewBox and whose only
            // content is a <symbol> (which never renders outside a <use> reference). Treat this
            // the same as a hard load error rather than silently shipping a blank texture.
            window.__logoReady = 'error';
            window.__logoError = `logo asset decoded to zero size (${P.logoAsset}) - likely an SVG with no root width/height/viewBox, or a <symbol>-only SVG with no <use> reference`;
            return;
          }
          mat.map = tex;
          mat.needsUpdate = true;
          mesh.userData.ready = true;
          window.__logoReady = true;
        },
        undefined,
        (err) => {
          window.__logoReady = 'error';
          window.__logoError = `logo asset failed to load (${P.logoAsset}): ${err && err.message ? err.message : err}`;
        }
      );
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

  // Occlusion regression guard. The frustum check above proved the ASSEMBLE
  // bug once already: it passed numerically while the wordmark was fully
  // hidden behind a block, because a frustum check only asks "is this mesh's
  // geometry inside the camera's view," never "is anything else drawn in
  // front of it." This check asks the second question directly.
  //
  // Method: project the logo mesh's bounding-box corners to get a pixel-space
  // region (reusing the same projection math as checkFrustum), then render
  // that region TWICE at the identical camera/geometry state (t already
  // fixed by the caller) - once normally (whatever else is in the scene),
  // once with every other object hidden (`hideAllExcept`). Since the logo
  // material is MeshBasicMaterial (unlit - see makeLogoPlane), hiding lights
  // and every other mesh does not change how the logo itself renders; the
  // ONLY thing hiding everything else can change is whether something else
  // was drawn ON TOP of it. So: any isolated-render pixel that differs from
  // the flat scene-background color is a real logo pixel (nothing else is
  // there to produce it). For each such pixel, compare the normal render's
  // color at the same coordinate - if they match (within tolerance), that
  // logo pixel is actually visible in the real scene; if they don't match,
  // something else is drawn there instead (occlusion). The ratio of
  // "visible in normal" to "visible in isolated" is the metric to threshold.
  function projectPixelBBox(camera, mesh, canvasW, canvasH, padPx) {
    camera.updateMatrixWorld(true);
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    const corners = [
      [box.min.x, box.min.y, box.min.z], [box.min.x, box.min.y, box.max.z],
      [box.min.x, box.max.y, box.min.z], [box.min.x, box.max.y, box.max.z],
      [box.max.x, box.min.y, box.min.z], [box.max.x, box.min.y, box.max.z],
      [box.max.x, box.max.y, box.min.z], [box.max.x, box.max.y, box.max.z],
    ].map((c) => new THREE.Vector3(c[0], c[1], c[2]));

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    corners.forEach((c) => {
      const p = c.clone().project(camera);
      const px = ((p.x + 1) / 2) * canvasW;
      const py = ((1 - p.y) / 2) * canvasH; // NDC y-up -> screen y-down
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    });
    const pad = padPx != null ? padPx : 10; // must stay bigger than any real AA bleed so the padded rect's own corners are guaranteed background, not logo edge
    const x = Math.max(0, Math.floor(minX) - pad);
    const y = Math.max(0, Math.floor(minY) - pad);
    const w = Math.min(canvasW, Math.ceil(maxX) + pad) - x;
    const h = Math.min(canvasH, Math.ceil(maxY) + pad) - y;
    return { x, y, w: Math.max(1, w), h: Math.max(1, h) };
  }

  function getCanvasRegionPixels(canvas, x, y, w, h) {
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h).data; // Uint8ClampedArray RGBA
  }

  // Hides every object in `scene` except `keepMesh` and keepMesh's own
  // ancestor chain (so a mesh nested inside a group, like SPIN's label
  // inside its rotating group, doesn't get hidden along with its parent).
  // Returns a restore function.
  function hideAllExcept(scene, keepMesh) {
    const keepChain = new Set();
    for (let n = keepMesh; n; n = n.parent) keepChain.add(n);
    const hidden = [];
    scene.traverse((obj) => {
      if (obj === scene || keepChain.has(obj)) return;
      let p = obj.parent, isDescendant = false;
      for (; p; p = p.parent) { if (p === keepMesh) { isDescendant = true; break; } }
      if (isDescendant) return;
      if (obj.visible !== false) { hidden.push(obj); obj.visible = false; }
    });
    return () => hidden.forEach((o) => { o.visible = true; });
  }

  // First version of this check used color-distance-from-background to
  // decide which pixels ARE the logo. Broke the first time it ran against a
  // real asset: Grace Family Roofing's real logo is white text on a
  // transparent PNG, composited over a scene whose background is also
  // white - the logo's own solid-white pixels were indistinguishable from
  // the isolated render's white background by color alone, producing a
  // false 0%-visible failure on a logo confirmed, by direct screenshot,
  // fully visible. Fixed by using the texture's own ALPHA channel as ground
  // truth for "is this a logo pixel" instead (see checkOcclusion) - alpha
  // has no such ambiguity, since the isolated pass nulls the scene
  // background entirely (not just color-matches it), so nothing but the
  // logo mesh can produce non-zero alpha there.
  //
  // ALPHA_TOL had to be measured, not guessed, and the number that fell out
  // is a mathematical floor, not a noise-calibration choice: sweeping it
  // against that same real logo showed visibleRatio staying near 0 all the
  // way up to alpha~240, then jumping to a clean 1.0 only at alpha>=245.
  // The reason isn't noise - it's how alpha blending works. A pixel with
  // partial alpha (anti-aliased edge, semi-transparent by design) shows a
  // DIFFERENT composited color depending on what's behind it: over nothing
  // (the isolated pass's nulled background) versus over a real block color
  // (the normal pass) are, by the alpha-compositing equation itself,
  // legitimately different colors - with zero occlusion involved either
  // way. Only a fully-opaque pixel (alpha=255) satisfies output=textureColor
  // regardless of what's behind it, making it the only pixel class this
  // comparison can validly use. 250 (out of 255) is the practical
  // implementation of "fully opaque," with a few units of headroom for
  // rounding - not a threshold to loosen, since anything looser reintroduces
  // exactly the blend-dependent noise just measured.
  const OCCLUSION_COLOR_TOL = 24; // used only for the (already-opaque) visibility comparison itself - see checkOcclusion
  const OCCLUSION_ALPHA_TOL = 250;
  // VISIBLE_RATIO_THRESHOLD: fraction of the logo's own isolated-render
  // alpha silhouette that must still match in the normal render. Set to
  // 0.9, not 0.5 or lower: a real occlusion event found in this project's
  // own testing (ASSEMBLE's wordmark fully hidden behind a block) hid
  // effectively 100% of the logo, not a partial sliver - there is no
  // legitimate reason a correctly-placed logo should be more than ~10%
  // covered by other scene geometry (a sliver at one edge from an
  // adjoining object, say), so anything worse is treated as the same class
  // of bug already found once, not a borderline case to tune around.
  const OCCLUSION_VISIBLE_RATIO_THRESHOLD = 0.9;

  function checkOcclusion(renderer, scene, camera, mesh, opts) {
    opts = opts || {};
    const colorTol = opts.colorTol != null ? opts.colorTol : OCCLUSION_COLOR_TOL;
    const alphaTol = opts.alphaTol != null ? opts.alphaTol : OCCLUSION_ALPHA_TOL;
    const threshold = opts.threshold != null ? opts.threshold : OCCLUSION_VISIBLE_RATIO_THRESHOLD;
    const canvas = renderer.domElement;
    const bbox = projectPixelBBox(camera, mesh, canvas.width, canvas.height);

    renderer.render(scene, camera);
    const normalPixels = getCanvasRegionPixels(canvas, bbox.x, bbox.y, bbox.w, bbox.h);

    // Isolated pass: hide every other object AND null the scene background
    // (not just hide objects - background is a flat fill, not an object,
    // and would otherwise still show through) so the only thing that can
    // produce non-zero alpha anywhere in this render is the logo mesh's own
    // texture. This is what makes "is this a logo pixel" a direct alpha
    // readout instead of a color-distance guess against a reference that
    // can coincidentally match the logo's own color (exactly what broke the
    // first version of this check against a real white-on-transparent PNG
    // logo composited over a white scene background).
    const restoreVisibility = hideAllExcept(scene, mesh);
    const savedBackground = scene.background;
    scene.background = null;
    const savedClearAlpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    renderer.render(scene, camera);
    const isolatedPixels = getCanvasRegionPixels(canvas, bbox.x, bbox.y, bbox.w, bbox.h);
    scene.background = savedBackground;
    renderer.setClearAlpha(savedClearAlpha);
    restoreVisibility();
    renderer.render(scene, camera); // leave the renderer/canvas back in the normal state

    let isolatedCount = 0, visibleCount = 0;
    const mismatchSamples = [];
    for (let i = 0; i < isolatedPixels.length; i += 4) {
      const ia = isolatedPixels[i + 3];
      if (ia < alphaTol) continue; // no logo content here - the true test, not a color guess
      isolatedCount++;
      const ir = isolatedPixels[i], ig = isolatedPixels[i + 1], ib = isolatedPixels[i + 2];
      const nr = normalPixels[i], ng = normalPixels[i + 1], nb = normalPixels[i + 2];
      const distMatch = Math.abs(ir - nr) + Math.abs(ig - ng) + Math.abs(ib - nb);
      if (distMatch <= colorTol) {
        visibleCount++;
      } else if (opts.debug && mismatchSamples.length < 5) {
        mismatchSamples.push({ i: i / 4, isolatedAlpha: ia, isolated: [ir, ig, ib], normal: [nr, ng, nb], distMatch });
      }
    }
    const visibleRatio = isolatedCount > 0 ? visibleCount / isolatedCount : 1;
    return {
      ok: visibleRatio >= threshold,
      visibleRatio: +visibleRatio.toFixed(3),
      isolatedLogoPixelCount: isolatedCount,
      visibleLogoPixelCount: visibleCount,
      threshold,
      colorTol,
      alphaTol,
      bbox,
      mismatchSamples: opts.debug ? mismatchSamples : undefined,
    };
  }

  return {
    parseParams, setupBasic, addThreeLightRig, makeLogoPlane, updateLogoOpacity,
    checkFrustum, FRUSTUM_MARGIN_NDC,
    checkOcclusion, hideAllExcept, OCCLUSION_COLOR_TOL, OCCLUSION_VISIBLE_RATIO_THRESHOLD,
  };
})();
