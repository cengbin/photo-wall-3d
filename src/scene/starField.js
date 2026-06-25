import * as THREE from 'three';
import {
  BACKGROUND_STAR_COUNT,
  BACKGROUND_STAR_OPACITY,
  BACKGROUND_STAR_RADIUS_MIN,
  BACKGROUND_STAR_RADIUS_RANDOM,
  BACKGROUND_STAR_SIZE,
  GALAXY_PARTICLE_COUNT,
  GALAXY_RADIUS
} from '../config/constants.js';

// 创建发光点纹理
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  const centerX = 32;
  const centerY = 32;
  const radius = 30;
  
  // 创建径向渐变
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createStarField(scene) {
  // 创建扁平椭圆星系效果
  const totalParticles = GALAXY_PARTICLE_COUNT;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(totalParticles * 3);
  const colors = new Float32Array(totalParticles * 3);
  const sizes = new Float32Array(totalParticles);

  for (let i = 0; i < totalParticles; i++) {
    const i3 = i * 3;
    
    // 使用指数分布，中心密集
    const radiusRandom = Math.pow(Math.random(), 0.3);
    const radius = radiusRandom * GALAXY_RADIUS;
    
    // 水平角度
    const theta = Math.random() * Math.PI * 2;
    
    // 垂直扁平化：y 轴压缩，形成盘状
    const flatness = 0.15; // 扁平度
    const y = (Math.random() - 0.5) * radius * flatness;
    
    // 椭圆形状：x 和 z 方向
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
    
    // 根据距离中心的距离决定颜色和亮度
    const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);
    const normalizedDistance = distanceFromCenter / GALAXY_RADIUS;
    
    // 五颜六色的彩色效果
    let r, g, b, size, opacity;
    
    // 随机选择颜色类型
    const colorType = Math.random();
    const intensity = 0.7 + Math.random() * 0.3;
    
    if (colorType < 0.14) {
      // 红色
      r = intensity;
      g = intensity * 0.2;
      b = intensity * 0.2;
    } else if (colorType < 0.28) {
      // 橙色
      r = intensity;
      g = intensity * 0.6;
      b = intensity * 0.1;
    } else if (colorType < 0.42) {
      // 黄色
      r = intensity;
      g = intensity * 0.9;
      b = intensity * 0.2;
    } else if (colorType < 0.56) {
      // 绿色
      r = intensity * 0.2;
      g = intensity;
      b = intensity * 0.3;
    } else if (colorType < 0.70) {
      // 青色
      r = intensity * 0.2;
      g = intensity * 0.8;
      b = intensity;
    } else if (colorType < 0.84) {
      // 蓝色
      r = intensity * 0.2;
      g = intensity * 0.3;
      b = intensity;
    } else {
      // 紫色/粉色
      r = intensity * 0.9;
      g = intensity * 0.3;
      b = intensity;
    }
    
    // 根据距离调整亮度和大小
    if (normalizedDistance < 0.2) {
      // 中心区域：更亮更大
      const brightnessFactor = 1.2 - normalizedDistance;
      r *= brightnessFactor;
      g *= brightnessFactor;
      b *= brightnessFactor;
      size = 3 + Math.random() * 4;
      opacity = 0.8 + Math.random() * 0.2;
    } else if (normalizedDistance < 0.5) {
      // 中间区域
      size = 2 + Math.random() * 3;
      opacity = 0.6 + Math.random() * 0.3;
    } else if (normalizedDistance < 0.8) {
      // 外围区域
      const dimFactor = 1.0 - (normalizedDistance - 0.5) / 0.3 * 0.4;
      r *= dimFactor;
      g *= dimFactor;
      b *= dimFactor;
      size = 1.5 + Math.random() * 2.5;
      opacity = 0.5 + Math.random() * 0.3;
    } else {
      // 最外层：更暗
      const dimFactor = 0.6 - (normalizedDistance - 0.8) / 0.2 * 0.3;
      r *= dimFactor;
      g *= dimFactor;
      b *= dimFactor;
      size = 1 + Math.random() * 2;
      opacity = 0.3 + Math.random() * 0.2;
    }
    
    colors[i3] = r;
    colors[i3 + 1] = g;
    colors[i3 + 2] = b;
    sizes[i] = size;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const glowTexture = createGlowTexture();
  
  const material = new THREE.PointsMaterial({
    size: 3,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const galaxy = new THREE.Points(geometry, material);
  scene.add(galaxy);
  
  // 添加额外的背景星星
  const bgStarCount = BACKGROUND_STAR_COUNT;
  const bgGeometry = new THREE.BufferGeometry();
  const bgPositions = new Float32Array(bgStarCount * 3);
  const bgColors = new Float32Array(bgStarCount * 3);
  
  for (let i = 0; i < bgStarCount; i++) {
    const i3 = i * 3;
    const radius = BACKGROUND_STAR_RADIUS_MIN + Math.random() * BACKGROUND_STAR_RADIUS_RANDOM;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    bgPositions[i3 + 2] = radius * Math.cos(phi);
    
    // 背景星星也使用彩色
    const colorType = Math.random();
    const brightness = 0.5 + Math.random() * 0.5;
    
    if (colorType < 0.14) {
      bgColors[i3] = brightness;
      bgColors[i3 + 1] = brightness * 0.3;
      bgColors[i3 + 2] = brightness * 0.3;
    } else if (colorType < 0.28) {
      bgColors[i3] = brightness;
      bgColors[i3 + 1] = brightness * 0.7;
      bgColors[i3 + 2] = brightness * 0.2;
    } else if (colorType < 0.42) {
      bgColors[i3] = brightness;
      bgColors[i3 + 1] = brightness * 0.9;
      bgColors[i3 + 2] = brightness * 0.3;
    } else if (colorType < 0.56) {
      bgColors[i3] = brightness * 0.3;
      bgColors[i3 + 1] = brightness;
      bgColors[i3 + 2] = brightness * 0.4;
    } else if (colorType < 0.70) {
      bgColors[i3] = brightness * 0.3;
      bgColors[i3 + 1] = brightness * 0.8;
      bgColors[i3 + 2] = brightness;
    } else if (colorType < 0.84) {
      bgColors[i3] = brightness * 0.3;
      bgColors[i3 + 1] = brightness * 0.4;
      bgColors[i3 + 2] = brightness;
    } else {
      bgColors[i3] = brightness * 0.9;
      bgColors[i3 + 1] = brightness * 0.4;
      bgColors[i3 + 2] = brightness;
    }
  }
  
  bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
  bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));
  
  const bgMaterial = new THREE.PointsMaterial({
    size: BACKGROUND_STAR_SIZE,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: BACKGROUND_STAR_OPACITY,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const bgStars = new THREE.Points(bgGeometry, bgMaterial);
  scene.add(bgStars);
}
