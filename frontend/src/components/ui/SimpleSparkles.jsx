import React, { useEffect, useRef } from 'react';

const SimpleSparkles = ({ 
  className, 
  particleColor = '#57A5FF', 
  particleCount = 100, // Slightly reduced count
  minSize = 4,
  maxSize = 8,
  speed = 0.01,  // Even slower speed
  connectDistance = 180
}) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let animationFrameId = null;
    
    // Preprocessing color values
    const baseColor = particleColor;
    const baseR = parseInt(baseColor.slice(1, 3), 16);
    const baseG = parseInt(baseColor.slice(3, 5), 16);
    const baseB = parseInt(baseColor.slice(5, 7), 16);
    
    // Brightened values (precomputed)
    const brightR = Math.min(255, baseR + 80);
    const brightG = Math.min(255, baseG + 80);
    const brightB = Math.min(255, baseB + 80);
    
    // Handle resize with debouncing
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setupCanvas();
      }, 100);
    };
    
    // Setup canvas with proper scaling
    const setupCanvas = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const pixelRatio = Math.min(devicePixelRatio, 1.5);
      
      // Get display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      // Set canvas size for HiDPI display
      canvas.width = Math.floor(displayWidth * pixelRatio);
      canvas.height = Math.floor(displayHeight * pixelRatio);
      
      // Reset transform before scaling
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelRatio, pixelRatio);
      
      // Enable antialiasing for gradients
      ctx.imageSmoothingEnabled = true;
      
      createParticles();
    };
    
    // Create particles
    const createParticles = () => {
      particles = [];
      
      // Adjust particle count based on canvas size
      const area = (canvas.clientWidth * canvas.clientHeight) / 250000;
      const adjustedCount = Math.min(particleCount, Math.max(40, Math.floor(particleCount * Math.min(1, area))));
      
      for (let i = 0; i < adjustedCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Extremely slow, consistent speed
        const speedFactor = (Math.random() * 0.15 + 0.1) * speed;
        
        // Ensure particles don't start at the borders
        const margin = maxSize * 2;
        const xPos = margin + Math.random() * (canvas.clientWidth - margin * 2);
        const yPos = margin + Math.random() * (canvas.clientHeight - margin * 2);
        
        particles.push({
          x: xPos,
          y: yPos,
          size: Math.random() * (maxSize - minSize) + minSize,
          speedX: Math.cos(angle) * speedFactor,
          speedY: Math.sin(angle) * speedFactor,
          opacity: 0.7 + Math.random() * 0.2, // More consistent opacity
          r: brightR,
          g: brightG,
          b: brightB,
          // Very tiny acceleration for extremely gentle movement
          acceleration: 0.0005,
          // Simplify to just what we need
          connectionGroup: i % 3, // For distributing connection checks
          opacityDirection: Math.random() > 0.5 ? 1 : -1, // For opacity pulsing
          opacitySpeed: 0.0005 + Math.random() * 0.0005, // Extremely slow opacity changes
          // Reduce direction changes
          directionChangeProb: 0.002 // Very rare direction changes
        });
      }
    };
    
    // Simple animation loop with fixed timestep for consistency
    let lastTime = 0;
    const fixedDelta = 16; // ~60fps equivalent timestep
    
    const animate = (timestamp) => {
      // Use fixed delta time for consistent movement across refresh rates
      const delta = fixedDelta;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      
      // Connection map
      const connectionsToRender = [];
      
      // Update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Very gentle opacity pulsing
        p.opacity += p.opacityDirection * p.opacitySpeed * delta;
        
        // Keep opacity in bounds
        if (p.opacity > 0.9) {
          p.opacity = 0.9;
          p.opacityDirection *= -1;
        } else if (p.opacity < 0.5) {
          p.opacity = 0.5;
          p.opacityDirection *= -1;
        }
        
        // Very rare tiny direction changes
        if (Math.random() < p.directionChangeProb) {
          const angle = Math.random() * Math.PI * 2;
          p.speedX += Math.cos(angle) * p.acceleration * delta;
          p.speedY += Math.sin(angle) * p.acceleration * delta;
          
          // Keep speed very consistent and slow
          const currentSpeed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
          const baseSpeed = (Math.random() * 0.15 + 0.1) * speed;
          
          // If speed deviates too much, adjust it back
          if (currentSpeed > baseSpeed * 1.5 || currentSpeed < baseSpeed * 0.5) {
            const ratio = baseSpeed / Math.max(currentSpeed, 0.001);
            p.speedX *= ratio;
            p.speedY *= ratio;
          }
        }
        
        // Update position (very slow movement)
        p.x += p.speedX * delta;
        p.y += p.speedY * delta;
        
        // Simple boundary handling
        const padding = p.size * 2;
        const effectiveWidth = canvas.clientWidth - padding;
        const effectiveHeight = canvas.clientHeight - padding;
        
        if (p.x < padding) {
          p.x = padding;
          p.speedX = Math.abs(p.speedX) * 0.7; // Gentler bounce
        } else if (p.x > effectiveWidth) {
          p.x = effectiveWidth;
          p.speedX = -Math.abs(p.speedX) * 0.7; // Gentler bounce
        }
        
        if (p.y < padding) {
          p.y = padding;
          p.speedY = Math.abs(p.speedY) * 0.7; // Gentler bounce
        } else if (p.y > effectiveHeight) {
          p.y = effectiveHeight;
          p.speedY = -Math.abs(p.speedY) * 0.7; // Gentler bounce
        }
        
        // Check connections (distributed across particle groups)
        if (p.connectionGroup === i % 3) {
          const checkDistance = connectDistance / 2; // Start with shorter distance check
          
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            
            // Quick distance approximation first to avoid expensive sqrt
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const approxDistance = Math.abs(dx) + Math.abs(dy); // Manhattan distance is faster
            
            // If quick check passes, do actual distance calculation
            if (approxDistance < checkDistance * 1.5) {
              const squareDistance = dx * dx + dy * dy;
              
              if (squareDistance < connectDistance * connectDistance) {
                const distance = Math.sqrt(squareDistance);
                
                connectionsToRender.push({
                  x1: p.x,
                  y1: p.y,
                  x2: p2.x,
                  y2: p2.y,
                  distance: distance,
                  opacity1: p.opacity,
                  opacity2: p2.opacity,
                  r: p.r,
                  g: p.g,
                  b: p.b
                });
              }
            }
          }
        }
      }
      
      // Render connections
      ctx.globalCompositeOperation = 'source-over';
      
      for (let i = 0; i < connectionsToRender.length; i++) {
        const conn = connectionsToRender[i];
        
        // Only draw connection if it's not too close (avoids overly bright centers)
        if (conn.distance > 15) {
          ctx.beginPath();
          
          // More pronounced connections
          const connectionOpacity = 0.5 * (1 - conn.distance / connectDistance);
          
          // Simple gradient
          const gradient = ctx.createLinearGradient(conn.x1, conn.y1, conn.x2, conn.y2);
          gradient.addColorStop(0, `rgba(${conn.r}, ${conn.g}, ${conn.b}, ${connectionOpacity * conn.opacity1})`);
          gradient.addColorStop(1, `rgba(${conn.r}, ${conn.g}, ${conn.b}, ${connectionOpacity * conn.opacity2})`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.moveTo(conn.x1, conn.y1);
          ctx.lineTo(conn.x2, conn.y2);
          ctx.stroke();
        }
      }
      
      // Render particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Only add glow to a few particles to avoid performance issues
        if (i % 10 === 0) {
          ctx.shadowBlur = 5;
          ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, 0.7)`;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        
        // Brighter radial gradient
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
        gradient.addColorStop(0.6, `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      
      // Request next frame
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Initialize and start animation
    setupCanvas();
    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleColor, particleCount, minSize, maxSize, speed, connectDistance]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className || ''}`}
      style={{ backgroundColor: 'transparent' }}
    />
  );
};

export default SimpleSparkles; 