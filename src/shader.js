// Grain du plastique orange (shader grain-gradient de Paper, Apache-2.0).
// Sans WebGL, ou si le CDN ne répond pas, on pose la classe no-webgl :
// le CSS affiche alors un dégradé orange fixe.

const PLASTIC = {
  back: "#e5531a",
  colors: ["#ff8a45", "#f45f20", "#d9440c", "#ff9a5a"],
  softness: 0.75,
  intensity: 0.3,
  noise: 0.7,
  shape: 6,
  speed: 0.15,
};

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Ne renvoie rien : le montage se termine en arrière-plan.
export function mountPlastic(el, { reducedMotion = false } = {}) {
  mount(el, reducedMotion);
}

async function mount(el, reducedMotion) {
  if (!hasWebGL()) {
    el.classList.add("no-webgl");
    return;
  }
  try {
    const {
      ShaderMount, grainGradientFragmentShader, getShaderColorFromString: color,
      getShaderNoiseTexture, ShaderFitOptions,
    } = await import("@paper-design/shaders");

    // La texture de bruit doit être entièrement chargée avant le montage.
    const noise = getShaderNoiseTexture();
    await noise.decode();

    new ShaderMount(el, grainGradientFragmentShader, {
      u_fit: ShaderFitOptions.cover, u_scale: 1, u_rotation: 0,
      u_offsetX: 0, u_offsetY: 0, u_originX: 0.5, u_originY: 0.5,
      u_worldWidth: 0, u_worldHeight: 0,
      u_colorBack: color(PLASTIC.back),
      u_colors: PLASTIC.colors.map(color),
      u_colorsCount: PLASTIC.colors.length,
      u_softness: PLASTIC.softness,
      u_intensity: PLASTIC.intensity,
      u_noise: PLASTIC.noise,
      u_shape: PLASTIC.shape,
      u_noiseTexture: noise,
    }, undefined, reducedMotion ? 0 : PLASTIC.speed);
  } catch (err) {
    console.warn("grain du plastique indisponible :", err);
    el.classList.add("no-webgl");
  }
}
