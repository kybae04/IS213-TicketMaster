import React, { useEffect, useRef } from 'react';

const SimpleSparkles = ({ 
  className, 
  particleColor = '#57A5FF', 
  particleCount = 120, // Reduced count for better performance
  minSize = 4,  // Slightly smaller for better performance
  maxSize = 8,  // Slightly smaller for better performance
  speed = 1.0,  // Reduced speed for smoother motion
  connectDistance = 180
}) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    let particles = [];
    let animationSpeed = 1;
    let animationFrameId = null;
    let hasRenderedFirstFrame = false;
    
    // Preprocessing color values to avoid string parsing in animation loop
    const baseColor = particleColor;
    const baseR = parseInt(baseColor.slice(1, 3), 16);
    const baseG = parseInt(baseColor.slice(3, 5), 16);
    const baseB = parseInt(baseColor.slice(5, 7), 16);
    
    // Brightened values (precomputed)
    const brightR = Math.min(255, baseR + 80);
    const brightG = Math.min(255, baseG + 80);
    const brightB = Math.min(255, baseB + 80);
    
    // More smooth resize handling with debouncing
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
      const pixelRatio = Math.min(devicePixelRatio, 1.5); // Cap at 1.5x for performance
      
      // Get display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      // Set canvas size for HiDPI display
      canvas.width = Math.floor(displayWidth * pixelRatio);
      canvas.height = Math.floor(displayHeight * pixelRatio);
      
      // Reset transform before scaling
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelRatio, pixelRatio);
      
      // Avoid blurry lines
      ctx.translate(0.5, 0.5);
      
      // Enable antialiasing for gradients
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      createParticles();
    };
    
    // Create particles
    const createParticles = () => {
      particles = []; // Clear existing particles
      
      // Adjust particle count based on canvas size for performance
      const area = (canvas.clientWidth * canvas.clientHeight) / 250000;
      const adjustedCount = Math.min(particleCount, Math.max(40, Math.floor(particleCount * Math.min(1, area))));
      
      for (let i = 0; i < adjustedCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speedFactor = (Math.random() * 0.5 + 0.5) * speed;
        
        particles.push({
          x: Math.random() * canvas.clientWidth,
          y: Math.random() * canvas.clientHeight,
          size: Math.random() * (maxSize - minSize) + minSize,
          speedX: Math.cos(angle) * speedFactor,
          speedY: Math.sin(angle) * speedFactor,
          opacity: Math.random() * 0.3 + 0.7,
          targetOpacity: Math.random() * 0.3 + 0.7, // Target for smooth transitions
          // Store precomputed color values
          r: brightR,
          g: brightG,
          b: brightB,
          acceleration: Math.random() * 0.008 + 0.002, // Reduced for smoother movement
          maxSpeed: speedFactor * 1.2, // Slightly reduced max speed
          // Add properties for optimization
          connectionCheckFrame: i % 3 // Distribute connection checks across frames
        });
      }
    };
    
    // Smooth opacity transitions to prevent flickering
    const updateParticleOpacity = (particle, delta) => {
      // Update target opacity occasionally
      if (Math.random() < 0.03) {
        particle.targetOpacity = Math.random() * 0.3 + 0.7;
      }
      
      // Smoothly transition current opacity to target
      const diff = particle.targetOpacity - particle.opacity;
      particle.opacity += diff * 0.03 * (delta / 16);
    };
    
    // Animation loop with consistent timing
    let lastTime = 0;
    let frameCount = 0;
    
    const animate = (timestamp) => {
      if (!hasRenderedFirstFrame) {
        hasRenderedFirstFrame = true;
      }
      
      // Calculate delta time (with safety caps)
      const deltaTime = lastTime ? Math.min(timestamp - lastTime, 33) : 16; // Cap at ~30fps equivalent
      lastTime = timestamp;
      
      const delta = deltaTime * animationSpeed;
      frameCount++;
      
      // Clear with alpha for smoother transitions
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      
      // Connection map for optimization
      const connectionsToRender = [];
      
      // Update particle positions first
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Smooth opacity updates
        updateParticleOpacity(p, delta);
        
        // Smoother acceleration adjustments
        if (frameCount % 3 === 0) { // Reduced frequency for smoother movement
          const acceleration = p.acceleration * delta;
          p.speedX += (Math.random() - 0.5) * acceleration;
          p.speedY += (Math.random() - 0.5) * acceleration;
          
          // Cap the speed
          const currentSpeed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
          if (currentSpeed > p.maxSpeed) {
            const ratio = p.maxSpeed / currentSpeed;
            p.speedX *= ratio;
            p.speedY *= ratio;
          }
        }
        
        // Update position with delta time scaling
        p.x += p.speedX * (delta / 16);
        p.y += p.speedY * (delta / 16);
        
        // Bounce off edges with smoother transitions
        if (p.x < 0 || p.x > canvas.clientWidth) {
          p.speedX = -p.speedX;
          p.x = p.x < 0 ? 0 : canvas.clientWidth;
        }
        if (p.y < 0 || p.y > canvas.clientHeight) {
          p.speedY = -p.speedY;
          p.y = p.y < 0 ? 0 : canvas.clientHeight;
        }
        
        // Distribute connection checks across frames
        if (p.connectionCheckFrame === frameCount % 3) {
          const checkLimit = Math.min(particles.length, i + 20); // Check fewer particles
          
          for (let j = i + 1; j < checkLimit; j++) {
            const p2 = particles[j];
            
            // Quick distance check first (square distance is faster than sqrt)
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const squareDistance = dx * dx + dy * dy;
            
            if (squareDistance < connectDistance * connectDistance) {
              const distance = Math.sqrt(squareDistance);
              
              if (distance < connectDistance) {
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
      
      // Now render particles (separate from position updates)
      // First render connections (behind particles)
      ctx.globalCompositeOperation = 'source-over';
      
      // Batch render connections
      for (let i = 0; i < connectionsToRender.length; i++) {
        const conn = connectionsToRender[i];
        
        ctx.beginPath();
        
        // Higher base opacity for connections
        const connectionOpacity = (1 - conn.distance / connectDistance) * 0.7;
        
        // Use gradient
        const gradient = ctx.createLinearGradient(conn.x1, conn.y1, conn.x2, conn.y2);
        gradient.addColorStop(0, `rgba(${conn.r}, ${conn.g}, ${conn.b}, ${connectionOpacity * conn.opacity1})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${connectionOpacity * 0.6})`);
        gradient.addColorStop(1, `rgba(${conn.r}, ${conn.g}, ${conn.b}, ${connectionOpacity * conn.opacity2})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.0; // Slightly thinner for performance
        ctx.moveTo(conn.x1, conn.y1);
        ctx.lineTo(conn.x2, conn.y2);
        ctx.stroke();
      }
      
      // Then render particles (on top of connections)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Define colors outside the loop for reuse
        const particleFillColor = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`;
        const particleWhiteColor = `rgba(255, 255, 255, ${p.opacity})`;
        
        // Use shadow only for larger particles to reduce flicker
        if ((i % 10 === 0) && p.size > minSize + 1) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = particleFillColor;
        } else {
          ctx.shadowBlur = 0;
        }
        
        // Draw particle
        ctx.beginPath();
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size
        );
        gradient.addColorStop(0, particleWhiteColor);
        gradient.addColorStop(0.4, particleFillColor);
        gradient.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
        
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      ctx.shadowBlur = 0; // Reset shadow
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Initialize
    setupCanvas();
    window.addEventListener('resize', handleResize);
    
    // Start animation
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