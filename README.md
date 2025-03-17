# Reaction-Diffusion Simulation

A lightweight, customizable JavaScript library for creating beautiful reaction-diffusion patterns in the browser using WebGL and Three.js.

- [Reaction Diffusion Simulation demo](https://vinodramamoorthy.com/reaction-diffusion-js/)

## Overview

This library simulates the Gray-Scott reaction-diffusion model, which is a mathematical model that describes how two chemical substances interact when they diffuse through a medium. This produces fascinating, organic-looking patterns that resemble natural phenomena like animal coat patterns, coral formations, and fingerprints.

## Features

- Real-time reaction-diffusion simulation in the browser
- High performance using WebGL and GPU acceleration
- Touch and mouse interaction for drawing patterns
- Customizable color schemes via hex codes
- Mobile-responsive design
- Configurable simulation parameters

## Installation

### Direct Download

Clone this repository or download the files directly:

```bash
git clone https://github.com/brutallyminimal/reaction-diffusion-js.git
```

## Basic Usage

1. Add a container element to your HTML:

```html
<div id="canvas-container"></div>
```

2. Import the library in your HTML:

```html
<script type="module">
  import { initSimulation, updateColors, resetSimulation, clearSimulation, config } from './reaction-diffusion.js';
  
  // Configure the simulation
  const simulationConfig = {
    // Simulation parameters
    dA: 0.45,      // Diffusion rate for substance A
    dB: 1.1,       // Diffusion rate for substance B
    feed: 0.0544,  // Feed rate
    kill: 0.0645,  // Kill rate
    size: 0.015,   // Brush size
    speed: 40,     // Simulation speed
    
    // Color configuration (hex values)
    backgroundColorHex: '#FFFFFF', // Background color
    patternColorHex: '#000000'     // Pattern color
  };
  
  // Initialize when the page loads
  window.addEventListener('load', () => {
    initSimulation(simulationConfig);
  });
</script>
```

## Customization

### Colors

You can customize the colors using hex codes:

1. During initialization:
```javascript
const simulationConfig = {
  // Other parameters...
  backgroundColorHex: '#3498db', // Background color
  patternColorHex: '#e74c3c'     // Pattern color
};
initSimulation(simulationConfig);
```

2. After initialization, by calling the `updateColors` function:
```javascript
// Set background color and pattern color
updateColors('#3498db', '#e74c3c');
```

### Simulation Parameters

You can adjust simulation parameters either during initialization:

```javascript
const simulationConfig = {
  dA: 0.5,      // Diffusion rate for substance A
  dB: 1.0,      // Diffusion rate for substance B
  feed: 0.055,  // Feed rate
  kill: 0.062,  // Kill rate
  size: 0.02,   // Brush size
  speed: 50,    // Simulation speed
  // Color options...
};
initSimulation(simulationConfig);
```

Or after initialization by modifying the config object:

```javascript
config.dA = 0.5;      // Diffusion rate for substance A
config.dB = 1.0;      // Diffusion rate for substance B
config.feed = 0.055;  // Feed rate
config.kill = 0.062;  // Kill rate
config.size = 0.02;   // Brush size
config.speed = 50;    // Simulation speed
```

## Interaction

- **Left Mouse Button/Touch**: Add substance A (clear an area)
- **Reset**: Call `resetSimulation()` to start a new pattern
- **Clear**: Call `clearSimulation()` to clear the canvas

## Examples

### Basic Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reaction Diffusion Demo</title>
  <style>
    body { margin: 0; overflow: hidden; }
    #canvas-container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <script type="module">
    import { initSimulation, updateColors, resetSimulation, clearSimulation, config } from './reaction-diffusion.js';
    
    // Initialize with custom colors
    const simulationConfig = {
      backgroundColorHex: '#1a2b3c',
      patternColorHex: '#d4e5f6'
    };
    
    window.addEventListener('load', () => {
      initSimulation(simulationConfig);
    });
  </script>
</body>
</html>
```

### Creating Color Presets

```javascript
import { initSimulation, updateColors, resetSimulation, clearSimulation, config } from './reaction-diffusion.js';

// Define color presets
const presets = [
  { bg: '#ffffff', pattern: '#000000' }, // Classic B&W
  { bg: '#264653', pattern: '#e9c46a' }, // Teal and Gold
  { bg: '#f1faee', pattern: '#e63946' }  // Light with Red
];

let currentPreset = 0;

function cycleColorPreset() {
  currentPreset = (currentPreset + 1) % presets.length;
  const preset = presets[currentPreset];
  updateColors(preset.bg, preset.pattern);
}

// Initialize the simulation with the first preset
window.addEventListener('load', () => {
  const initialConfig = {
    // You can set other simulation parameters here
    backgroundColorHex: presets[0].bg,
    patternColorHex: presets[0].pattern
  };
  
  initSimulation(initialConfig);
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cycle through color presets when 'p' is pressed
    if (e.key === 'p') cycleColorPreset();
    
    // Reset simulation when 'r' is pressed
    if (e.key === 'r') resetSimulation();
    
    // Clear simulation when 'c' is pressed
    if (e.key === 'c') clearSimulation();
  });
});
```

## How It Works

This library implements the Gray-Scott reaction-diffusion model using WebGL shaders for high-performance computation. The simulation runs on the GPU, allowing for real-time interaction and visualization of complex patterns.

## Browser Compatibility

Works in all modern browsers that support WebGL:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License

## Credits

This implementation is inspired by various reaction-diffusion resources and projects:
- Karl Sims' [Reaction-Diffusion Tutorial](https://www.karlsims.com/rd.html)
- [pmneila's WebGL Reaction-Diffusion](https://github.com/pmneila/jsexp)
- [DiegoOchoaa's implementation](https://github.com/DiegoOchoaa/Reaction-Diffusion)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.