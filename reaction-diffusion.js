import * as THREE from "https://cdn.skypack.dev/three@0.146.0";

// Helper function to convert hex to rgb
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return { r, g, b };
}

// Shader code
const vertexShaderSource = `
varying vec2 vUvs;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUvs = uv;
}
`;

const fragmentShaderScreenSource = `
precision mediump float;
//Our input texture
uniform sampler2D uTexture; 

varying vec2 vUvs;
uniform vec2 uResolution;
uniform vec3 uColorA; // Color for low concentration (background)
uniform vec3 uColorB; // Color for high concentration (pattern)

void main() {
  //special method to sample from texture
  vec4 initTexture = texture2D(uTexture, vUvs);

  vec3 colour = initTexture.rgb;
  
  float final = initTexture.b;

  float mult = 3.;
  final = final*final*15.;
  
  // Mix between colorA and colorB based on the value of final
  vec3 finalColor = mix(uColorB, uColorA, 1.0-final);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const fragmentShaderBufferSource = `
precision mediump float;
//Our input texture
uniform sampler2D uTexture; 
uniform vec2 uResolution;

uniform float udA;
uniform float udB;
uniform float ufeed;
uniform float uk;
uniform float x;
uniform float y;
uniform float Lpress;
uniform float Rpress;
uniform float mSize;

varying vec2 vUvs;

float laplaceA = 0.0;
float laplaceB = 0.0;

void main() {
  vec3 color = vec3(0.0);

  vec4 lookup = texture2D(uTexture, vUvs);


  float A = lookup.r;
  float B = lookup.b;
  
  
  // Compute Laplacian for A
  laplaceA += texture2D(uTexture, vUvs + vec2(0, 0) / uResolution.xy).r * -1.0;
  laplaceA += texture2D(uTexture, vUvs + vec2(1, 0) / uResolution.xy).r * 0.2;
  laplaceA += texture2D(uTexture, vUvs + vec2(-1, 0) / uResolution.xy).r * 0.2;
  laplaceA += texture2D(uTexture, vUvs + vec2(0, 1) / uResolution.xy).r * 0.2;
  laplaceA += texture2D(uTexture, vUvs + vec2(0, -1) / uResolution.xy).r * 0.2;
  
  laplaceA += texture2D(uTexture, vUvs + vec2(1, 1) / uResolution.xy).r * 0.05;
  laplaceA += texture2D(uTexture, vUvs + vec2(-1, -1) / uResolution.xy).r * 0.05;
  laplaceA += texture2D(uTexture, vUvs + vec2(1, -1) / uResolution.xy).r * 0.05;
  laplaceA += texture2D(uTexture, vUvs + vec2(-1, 1) / uResolution.xy).r * 0.05;
  
  // Compute Laplacian for B
  laplaceB += texture2D(uTexture, vUvs + vec2(0, 0) / uResolution.xy).b * -1.0;
  laplaceB += texture2D(uTexture, vUvs + vec2(1, 0) / uResolution.xy).b * 0.2;
  laplaceB += texture2D(uTexture, vUvs + vec2(-1, 0) / uResolution.xy).b * 0.2;
  laplaceB += texture2D(uTexture, vUvs + vec2(0, 1) / uResolution.xy).b * 0.2;
  laplaceB += texture2D(uTexture, vUvs + vec2(0, -1) / uResolution.xy).b * 0.2;
  
  laplaceB += texture2D(uTexture, vUvs + vec2(1, 1) / uResolution.xy).b * 0.05;
  laplaceB += texture2D(uTexture, vUvs + vec2(-1, -1) / uResolution.xy).b * 0.05;
  laplaceB += texture2D(uTexture, vUvs + vec2(1, -1) / uResolution.xy).b * 0.05;
  laplaceB += texture2D(uTexture, vUvs + vec2(-1, 1) / uResolution.xy).b * 0.05;
  
  vec2 uv = gl_FragCoord.xy / uResolution.xy; // Normalize pixel coordinates
  float k_mult = 1.;
  if (lookup.g > 0.5){
    k_mult = 0.5 + lookup.g;
  }
  

  // Update concentrations
  float newA = A + ((udA) * laplaceA - A * B * B + ufeed * (1.0 - A));
  float newB = B + (udB * laplaceB + A * B * B - ((uk*k_mult) + ufeed) * B);
  
  // Clamp to prevent instability
  newA = clamp(newA, 0.0, 1.0);
  newB = clamp(newB, 0.0, 1.0);

  // Convert mouse position from pixel space to normalized texture space
  vec2 mouse = vec2(x, y) / uResolution; // Normalize mouse position
  mouse.y = 1.0 - mouse.y; // Invert the Y-coordinate to match the texture's coordinate system

  // Scale the mouse position and texture coordinates based on aspect ratio
  vec2 resolutionAspect = uResolution / min(uResolution.x, uResolution.y); // Aspect ratio scaling factor
  vec2 adjustedUvs = (uv - 0.5) * resolutionAspect + 0.5;
  vec2 adjustedMouse = (mouse - 0.5) * resolutionAspect + 0.5;
  
  // Calculate the distance between the adjusted mouse and the current pixel (uv)
  float dist = distance(adjustedUvs, adjustedMouse);
  // Apply effect to A when the mouse is within a certain distance
  if (dist < mSize ) {
    if(Rpress == 1.){
      newB = .4; 
    }
    if(Lpress == 1.){
      newA = 1.0;
      newB = .0;
    }
 // You can change this value to modify the interaction strength
  }
  
  // Output the color
  gl_FragColor = vec4(newA, lookup.g, newB, 1.0);

}
`;

// Check if user is on a mobile device to adjust parameters
const ismob = /iphone|ipod|android|windows phone|blackberry|mobile/i.test(navigator.userAgent.toLowerCase());

// Configuration values with defaults
const config = {
  dA: 0.45,     // Diffusion rate for A
  dB: 1.1,      // Diffusion rate for B
  feed: 0.0544, // Feed rate
  kill: 0.0645, // Kill rate
  size: ismob ? 0.07 : 0.015, // Brush size
  speed: ismob ? 75 : 40,     // Simulation speed
  backgroundColorHex: '#FFFFFF', // Background color in hex
  patternColorHex: '#000000',    // Pattern color in hex
  // RGB color values (will be computed from hex)
  colorA: { r: 1.0, g: 1.0, b: 1.0 },  // Background color
  colorB: { r: 0.0, g: 0.0, b: 0.0 }   // Pattern color
};

// Set initial RGB colors from hex values
config.colorA = hexToRgb(config.backgroundColorHex);
config.colorB = hexToRgb(config.patternColorHex);

// Scene related variables
let scene, bufferScene, renderer, camera;
let mesh, bufferMesh;
let quadMaterial, bufferMaterial;
let renderBufferA, renderBufferB;
let sizes, resolution;
let mouseX = 0, mouseY = 0;
let LeftClick = 0;
let touchX = 0, touchY = 0, touch = 0;

// Function to update colors
function updateColors(backgroundHex, patternHex) {
  config.backgroundColorHex = backgroundHex;
  config.patternColorHex = patternHex;
  config.colorA = hexToRgb(backgroundHex);
  config.colorB = hexToRgb(patternHex);
}

// Function to reset the simulation
function resetSimulation() {
  // Create a new data texture with a rectangle in the center
  const newDataTexture = createDataTexture();

  // Update the texture in the buffer material
  bufferMaterial.uniforms.uTexture.value = newDataTexture;

  renderer.setRenderTarget(renderBufferA);
  renderer.clear();

  renderer.setRenderTarget(renderBufferB);
  renderer.clear();
}

// Function to clear the simulation (reset to initial state with no patterns)
function clearSimulation() {
  // Create a cleared texture (no seed pattern)
  bufferMaterial.uniforms.uTexture.value = createDataTexture(true);

  // Clear both render buffers
  [renderBufferA, renderBufferB].forEach(buffer => {
    renderer.setRenderTarget(buffer);
    renderer.clear();
  });
}

// Function to create the initial texture
function createDataTexture(clear = false) {
  // Create a buffer with color data
  const size = sizes.width * sizes.height;
  const data = new Uint8Array(4 * size);

  // Define the rectangle dimensions (4% of the texture size)
  const rectWidth = Math.floor(sizes.width * 0.04);
  const rectHeight = Math.floor(sizes.height * 0.04);
  const rectXStart = Math.floor((sizes.width - rectWidth) / 2);
  const rectYStart = Math.floor((sizes.height - rectHeight) / 2);

  // Loop through each pixel in the texture
  for (let y = 0; y < sizes.height; y++) {
    for (let x = 0; x < sizes.width; x++) {
      const i = y * sizes.width + x;
      const stride = i * 4;

      // Add a seed rectangle in the center (if not clearing)
      if (!clear && 
          x >= rectXStart && x < rectXStart + rectWidth && 
          y >= rectYStart && y < rectYStart + rectHeight) {
        // Set pixels inside rectangle (high A concentration)
        data[stride] = 255;    // Red channel (A)
        data[stride + 1] = 0;  // Green channel (unused)
        data[stride + 2] = 0;  // Blue channel (B)
      } else {
        // Set pixels outside rectangle (high B concentration)
        data[stride] = 0;      // Red channel (A)
        data[stride + 1] = 0;  // Green channel (unused)
        data[stride + 2] = 255;// Blue channel (B)
      }
      data[stride + 3] = 255;  // Alpha (always fully opaque)
    }
  }

  // Create and return the texture
  const texture = new THREE.DataTexture(
    data,
    sizes.width, 
    sizes.height,
    THREE.RGBAFormat
  );
  texture.needsUpdate = true;
  return texture;
}

// Animation loop
function tick() {
  // Process multiple steps per frame based on speed setting
  for (let i = 0; i < config.speed; i++) {
    // Render to the offscreen buffer
    renderer.setRenderTarget(renderBufferA);
    renderer.render(bufferScene, camera);

    // Swap the buffers (ping-pong)
    [renderBufferA, renderBufferB] = [renderBufferB, renderBufferA];

    // Update the input texture and uniforms for the next pass
    const uniforms = bufferMaterial.uniforms;
    uniforms.uTexture.value = renderBufferB.texture;
    uniforms.udA.value = config.dB;
    uniforms.udB.value = config.dA;
    uniforms.ufeed.value = config.feed;
    uniforms.uk.value = config.kill;
    uniforms.x.value = mouseX + touchX;
    uniforms.y.value = mouseY + touchY;
    uniforms.Rpress.value = LeftClick;
    uniforms.Lpress.value = touch;
    uniforms.mSize.value = config.size;
  }

  // Render the final result to the screen
  const screenUniforms = quadMaterial.uniforms;
  screenUniforms.uTexture.value = renderBufferA.texture;
  screenUniforms.uColorA.value.set(config.colorA.r, config.colorA.g, config.colorA.b);
  screenUniforms.uColorB.value.set(config.colorB.r, config.colorB.g, config.colorB.b);
  
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  // Continue animation loop
  window.requestAnimationFrame(tick);
}

// Function to handle window resize
function onWindowResize() {
  const container = document.getElementById('canvas-container');
  
  // Get new dimensions
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Update sizes
  sizes.width = width;
  sizes.height = height;
  
  // Update camera
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update render buffers
  renderBufferA.setSize(width, height);
  renderBufferB.setSize(width, height);

  // Update uniforms
  const uniforms = [quadMaterial.uniforms, bufferMaterial.uniforms];
  uniforms.forEach(u => {
    u.uResolution.value.x = width;
    u.uResolution.value.y = height;
  });
  
  // Reset with new dimensions
  resetSimulation();
}

// Mouse event handlers
function setupMouseEvents() {
  const canvas = renderer.domElement;
  let isMouseDown = false;
  
  canvas.addEventListener('mousemove', (event) => {
    // Get canvas bounds
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    // Restore left click state if re-entering while mouse is down
    if (isMouseDown) {
      LeftClick = 1.0;
    }
  });

  canvas.addEventListener('mousedown', function(event) {
    if (event.button === 0) {
      isMouseDown = true;
      LeftClick = 1.0;
    }
  });
  
  canvas.addEventListener('mouseup', function(event) {
    if (event.button === 0) {
      isMouseDown = false;
      LeftClick = 0.0;
    }
  });
  
  // Handle mouse leaving canvas
  canvas.addEventListener('mouseleave', function() {
    // Only set LeftClick to 0 but keep isMouseDown state
    LeftClick = 0.0;
  });
  
  // Global events to handle releasing mouse outside canvas
  document.addEventListener('mouseup', function(event) {
    if (event.button === 0) {
      isMouseDown = false;
      LeftClick = 0.0;
    }
  });
}

// Touch event handlers
function setupTouchEvents() {
  const canvas = renderer.domElement;
  let isTouching = false;
  
  function handleTouchStart(event) {
    event.preventDefault();
    isTouching = true;
    const rect = canvas.getBoundingClientRect();
    touchX = event.touches[0].clientX - rect.left;
    touchY = event.touches[0].clientY - rect.top;
    touch = 1;
  }

  function handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      touchX = event.touches[0].clientX - rect.left;
      touchY = event.touches[0].clientY - rect.top;
      // Ensure touch state is maintained while moving
      if (isTouching) {
        touch = 1;
      }
    }
  }

  function handleTouchEnd(event) {
    event.preventDefault();
    isTouching = false;
    touch = 0;
  }

  // Touch enters canvas after starting elsewhere
  function handleTouchEnter(event) {
    if (event.touches.length > 0 && isTouching) {
      const rect = canvas.getBoundingClientRect();
      touchX = event.touches[0].clientX - rect.left;
      touchY = event.touches[0].clientY - rect.top;
      touch = 1;
    }
  }

  canvas.addEventListener("touchstart", handleTouchStart, false);
  canvas.addEventListener("touchmove", handleTouchMove, false);
  canvas.addEventListener("touchend", handleTouchEnd, false);
  canvas.addEventListener("touchcancel", handleTouchEnd, false);
  
  // Global document events to handle touch outside canvas
  document.addEventListener("touchend", function() {
    isTouching = false;
    touch = 0;
  });
}

// Initialize the simulation
function initSimulation(customConfig = {}) {
  // Apply any custom configuration
  Object.assign(config, customConfig);
  
  // Update RGB values from hex values
  if (customConfig.backgroundColorHex) {
    config.colorA = hexToRgb(config.backgroundColorHex);
  }
  if (customConfig.patternColorHex) {
    config.colorB = hexToRgb(config.patternColorHex);
  }

  // Get canvas container element
  const container = document.getElementById('canvas-container');
  
  // Initialize window size based on container size
  sizes = {
    width: container.clientWidth,
    height: container.clientHeight
  };

  // Create scenes
  scene = new THREE.Scene();
  bufferScene = new THREE.Scene();
  
  // Initialize camera
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Set up resolution
  resolution = new THREE.Vector3(
    sizes.width,
    sizes.height,
    window.devicePixelRatio
  );

  // Create render buffers
  renderBufferA = new THREE.WebGLRenderTarget(
    sizes.width,
    sizes.height,
    {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false
    }
  );

  renderBufferB = new THREE.WebGLRenderTarget(
    sizes.width,
    sizes.height,
    {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false
    }
  );

  // Create geometry and materials
  const geometry = new THREE.PlaneGeometry(2, 2);
  
  // Buffer Material
  bufferMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: createDataTexture() },
      udA: { value: config.dB },
      udB: { value: config.dA },
      uk: { value: config.kill },
      ufeed: { value: config.feed },
      x: { value: 0.0 },
      y: { value: 0.0 },
      mSize: { value: config.size },
      Lpress: { value: 0.0 },
      Rpress: { value: 0.0 },
      uResolution: { value: resolution },
    },
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderBufferSource
  });

  // Screen Material
  quadMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uResolution: { value: resolution },
      uColorA: { value: new THREE.Vector3(config.colorA.r, config.colorA.g, config.colorA.b) },
      uColorB: { value: new THREE.Vector3(config.colorB.r, config.colorB.g, config.colorB.b) }
    },
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderScreenSource
  });

  // Create meshes
  mesh = new THREE.Mesh(geometry, quadMaterial);
  scene.add(mesh);
  
  bufferMesh = new THREE.Mesh(geometry, bufferMaterial);
  bufferScene.add(bufferMesh);

  // Set up event listeners
  setupMouseEvents();
  setupTouchEvents();
  window.addEventListener('resize', onWindowResize);

  // Start the animation loop
  resetSimulation();
  tick();
}

// Export the functions and config for external use
export { 
  initSimulation, 
  updateColors, 
  resetSimulation, 
  clearSimulation,
  config
};