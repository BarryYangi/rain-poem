# Listen, the rain is falling

A generative visual poem inspired by the concrete poetry of E.E. Cummings. This project creates an interactive audiovisual experience where text falls like rain, accumulating in piles of digital ink.

## Features

- **Visual Poetry**: Text drops sequentially ("f-a-l-l-i-n-g") with physics-based gravity and collision.
- **Ink Aesthetics**: Custom shaders and gradients simulate deep blue ink (`#021CBC`) bleeding into paper.
- **Atmosphere**: 
  - Subtle film grain and paper texture.
  - Wind simulation using Perlin noise.
  - "Wabi-sabi" stacking mechanics where old letters fade to make room for new ones.
- **Generative Audio**:
  - Ambient rain texture using filtered Pink Noise.
  - Pentatonic droplet sounds triggered by text impact using Tone.js.

## Tech Stack

- **Framework**: React + Vite
- **Creative Coding**: p5.js
- **Audio**: Tone.js
- **Runtime**: Bun (compatible with Node.js/npm)

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/BarryYangi/rain-poem.git
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Start the development server:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Deployment

This project is ready to be deployed on Vercel or Netlify.

## Credits

Inspired by E.E. Cummings' poem *"l(a"*.
