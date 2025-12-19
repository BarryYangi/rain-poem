import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import * as Tone from 'tone';

const RainSketch = () => {
  const sketchRef = useRef();
  const [started, setStarted] = useState(false);
  const p5Instance = useRef(null);
  const synthRef = useRef(null);
  const noiseRef = useRef(null);

  const startAudio = async () => {
    await Tone.start();
    
    // Create a synth for the "plink" sounds
    // Simple sine/triangle with short decay
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      },
      volume: -10
    }).toDestination();

    // Create a noise source for background rain
    const noise = new Tone.Noise("pink").start();
    const filter = new Tone.AutoFilter({
      frequency: "8m", 
      min: 800, 
      max: 15000 
    }).connect(Tone.Destination);
    
    // Static filter for now, better rain sound
    const lowpass = new Tone.Filter(800, "lowpass").toDestination();
    noise.connect(lowpass);
    noise.volume.value = -20;
    
    noiseRef.current = noise;
    
    setStarted(true);
  };

  useEffect(() => {
    if (!started) return;

    const sketch = (p) => {
      let font;
      let entities = []; // Unified list for drops and piled items
      let rainChars = ['f', 'a', 'l', 'l', 'i', 'n', 'g'];
      let charIndex = 0; 
      let lastSpawn = 0;
      let spawnRate = 10;
      let windOffset = 0;
      
      // Main Ink Color Definition
      const INK_COLOR = '#021CBC'; 
      const INK_DARK = '#010E5E'; // Slightly darker for gradient bottom
      
      let grainImg;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.textFont('Courier Prime');
        p.textSize(24);
        p.textAlign(p.CENTER, p.CENTER);
        windOffset = p.random(1000);
        
        // Generate grain texture
        grainImg = p.createImage(p.width, p.height);
        grainImg.loadPixels();
        for (let i = 0; i < grainImg.width; i++) {
          for (let j = 0; j < grainImg.height; j++) {
            let gray = p.random(200, 255); // Light gray base
            let alpha = p.random(20, 40); // Subtle alpha
            grainImg.set(i, j, p.color(gray, alpha));
          }
        }
        grainImg.updatePixels();
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        grainImg = p.createImage(p.width, p.height);
        grainImg.loadPixels();
        for (let i = 0; i < grainImg.width; i++) {
          for (let j = 0; j < grainImg.height; j++) {
             grainImg.set(i, j, p.color(p.random(200, 255), p.random(20, 40)));
          }
        }
        grainImg.updatePixels();
      };

      function drawInkedText(char, x, y, alpha = 1) {
          // Create gradient for ink effect
          let grad = p.drawingContext.createLinearGradient(x, y - 12, x, y + 12);
          
          if (alpha < 1) {
             p.drawingContext.globalAlpha = alpha;
          }
          
          grad.addColorStop(0, INK_COLOR);
          grad.addColorStop(1, INK_DARK);
          
          p.drawingContext.fillStyle = grad;
          p.text(char, x, y);
          
          // Reset global alpha
          p.drawingContext.globalAlpha = 1.0;
      }

      p.draw = () => {
        p.background('#f8f7f4');
        p.fill(INK_COLOR);
        p.stroke(INK_COLOR);

        // Calculate wind force
        let windForce = p.map(p.noise(windOffset), 0, 1, -1.0, 1.0);
        windOffset += 0.01;

        // Draw wavy static text
        p.noStroke();
        p.textSize(28);
        p.textAlign(p.LEFT, p.CENTER); 
        
        // Custom wavy draw with ink gradient
        let startX = p.width / 2;
        let startY = p.height * 0.15;
        let str1 = "Listen,";
        let x = startX - (p.textWidth(str1) / 2);
        for (let i = 0; i < str1.length; i++) {
           let char = str1.charAt(i);
           let yOff = p.sin((p.frameCount * 0.02) + (i * 0.5)) * 5;
           drawInkedText(char, x, startY + yOff);
           x += p.textWidth(char);
        }
        
        let str2 = "the rain is";
        x = (p.width / 2 + 10) - (p.textWidth(str2) / 2);
        startY = p.height * 0.15 + 40;
        for (let i = 0; i < str2.length; i++) {
           let char = str2.charAt(i);
           let yOff = p.sin((p.frameCount * 0.02) + (i * 0.4)) * 4;
           drawInkedText(char, x, startY + yOff);
           x += p.textWidth(char);
        }
        
        p.textAlign(p.CENTER, p.CENTER);

        // Spawn drops
        if (p.frameCount - lastSpawn > spawnRate) {
          spawnDrop();
          lastSpawn = p.frameCount;
          spawnRate = p.random(6, 12); 
        }

        // Logic loop
        let groundY = p.height - 50;
        
        for (let i = entities.length - 1; i >= 0; i--) {
          let e = entities[i];
          
          if (e.state === 'falling') {
            // Apply physics
            e.y += e.speed;
            e.x += windForce;
            e.x += p.sin(p.frameCount * 0.05 + e.id) * 0.5;
            
            // Draw tail
            if (e.speed > 2) {
                let gradient = p.drawingContext.createLinearGradient(e.x, e.y - 12, e.x, e.y - e.tailLength);
                // RGB for #021CBC is 2, 28, 188
                gradient.addColorStop(0, 'rgba(2, 28, 188, 0.4)'); 
                gradient.addColorStop(1, 'rgba(2, 28, 188, 0)');
                p.drawingContext.fillStyle = gradient;
                p.noStroke();
                
                p.beginShape();
                p.vertex(e.x - 1.5, e.y - 10);
                p.vertex(e.x + 1.5, e.y - 10);
                p.vertex(e.x, e.y - e.tailLength);
                p.endShape(p.CLOSE);
            }

            // Draw char
            p.noStroke();
            drawInkedText(e.char, e.x, e.y);
            
            // Collision Detection
            let landed = false;
            let landY = groundY;

            if (e.y >= groundY) {
               landed = true;
               landY = groundY;
            } else if (e.y > p.height * 0.5) {
               for (let j = 0; j < entities.length; j++) {
                  if (i === j) continue;
                  let other = entities[j];
                  if (other.state === 'stacked') {
                     if (p.abs(e.x - other.x) < 18) {
                        if (e.y >= other.y - 20 && e.y < other.y) {
                           landed = true;
                           landY = other.y - 20;
                           break;
                        }
                     }
                  }
               }
            }
            
            if (landed) {
               e.state = 'stacked';
               e.y = landY;
               e.speed = 0;
               e.decay = p.random(0.5, 1.5); // Reverted to faster decay
               e.angle = p.random(-0.15, 0.15); 
               if (e.y > p.height * 0.2) playPlink(); 
            }

          } else if (e.state === 'stacked') {
             // Stacked Behavior
             e.alpha -= e.decay;
             if (e.alpha <= 0) {
                entities.splice(i, 1);
                continue; 
             }
             
             // Gravity/Support Check
             let supported = false;
             if (e.y >= groundY - 1) { 
                supported = true;
             } else {
                for (let j = 0; j < entities.length; j++) {
                   if (i === j) continue;
                   let other = entities[j];
                   if (other.state === 'stacked') {
                      if (p.abs(e.x - other.x) < 18 && p.abs(e.y - (other.y - 20)) < 5) {
                         supported = true;
                         break;
                      }
                   }
                }
             }
             
             if (!supported) {
                e.state = 'falling';
                e.speed = 4; 
                e.tailLength = 0; 
                e.angle = 0;
             }

             // Render Stacked
             p.push();
             p.translate(e.x, e.y);
             p.rotate(e.angle);
             // Use normalized alpha for helper
             drawInkedText(e.char, 0, 0, e.alpha / 255);
             p.pop();
          }
        }
        
        // Grain Overlay
        p.blendMode(p.MULTIPLY);
        // Small jitter for "film grain" feel
        let gx = p.random(-5, 5);
        let gy = p.random(-5, 5);
        if (grainImg) {
           // Draw slightly larger to cover jitter
           p.image(grainImg, gx, gy, p.width + 10, p.height + 10);
        }
        p.blendMode(p.BLEND);
      };

      function spawnDrop() {
        let x = p.random(p.width * 0.1, p.width * 0.9);
        let startY = p.random(-100, -10);
        
        let char = rainChars[charIndex];
        charIndex = (charIndex + 1) % rainChars.length;
        
        entities.push({
          id: p.random(10000),
          state: 'falling',
          x: x,
          y: startY,
          char: char,
          speed: p.random(6, 10),
          tailLength: p.random(20, 50),
          alpha: 255,
          angle: 0
        });
      }

      function playPlink() {
        if (synthRef.current) {
          const notes = ["G5", "A5", "C6", "D6", "E6", "G6"];
          const note = notes[Math.floor(Math.random() * notes.length)];
          synthRef.current.triggerAttackRelease(note, "64n", Tone.now(), Math.random() * 0.3 + 0.1);
        }
      }
    };

    p5Instance.current = new p5(sketch, sketchRef.current);

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
      }
    };
  }, [started]);

  return (
    <>
      {!started && (
        <div className="overlay">
          <h1>Listen, the rain is falling</h1>
          <p>A visual poem recreation</p>
          <button onClick={startAudio}>Start Experience</button>
        </div>
      )}
      <div ref={sketchRef} />
    </>
  );
};

export default RainSketch;
