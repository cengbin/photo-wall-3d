import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

const imageFiles = Array.from({length: 64}, (_, i) => `${i + 1}.png`);

const PARTICLE_COUNT = 1500;

let scene, camera, renderer, controls;
let sprites = [];
let textures = [];
let raycaster, mouse;
let hoveredSprite = null;

init();

function init() {
  const container = document.getElementById('container');

  // 场景
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0008);

  // 相机
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 2, 2000);
  camera.position.z = 3000;

  // 渲染器
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;              // 启用阻尼（惯性），使控制更平滑
  controls.dampingFactor = 0.05;              // 阻尼系数，值越小惯性越大
  // controls.autoRotate = true;                 // 自动旋转
  controls.autoRotateSpeed = 0.1;             // 自动旋转速度
  controls.minDistance = 100;                 // 最小缩放距离
  controls.maxDistance = 3000;                // 最大缩放距离

  // 加载所有图片纹理
  const textureLoader = new THREE.TextureLoader();
  const basePath = 'resource/images/';
  let loadedCount = 0;

  imageFiles.forEach((filename, index) => {
    textureLoader.load(
      basePath + filename,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        textures[index] = texture;
        loadedCount++;

        if (loadedCount === imageFiles.length) {
          createParticles();
          document.getElementById('loading').classList.add('hidden');
          animate();
        }
      },
      undefined,
      (error) => {
        console.error('Failed to load:', filename, error);
        loadedCount++;
        if (loadedCount === imageFiles.length) {
          createParticles();
          document.getElementById('loading').classList.add('hidden');
          animate();
        }
      }
    );
  });

  // 添加辅助工具
  addHelpers();

  // 创建宇宙星空背景
  createStarField();

  // 初始化射线投射器和鼠标向量
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 事件监听
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onMouseClick);
}

function addHelpers() {
  // 坐标轴辅助器 (红色=X轴, 绿色=Y轴, 蓝色=Z轴)
  const axesHelper = new THREE.AxesHelper(10000);
  scene.add(axesHelper);

  // 网格辅助器 (地面网格 - 红色)
  const gridHelper = new THREE.GridHelper(2000, 20, 0xff0000, 0x880000);
  scene.add(gridHelper);
}

function createStarField() {
  // 创建扁平椭圆星系效果
  const totalParticles = 100000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(totalParticles * 3);
  const colors = new Float32Array(totalParticles * 3);
  const sizes = new Float32Array(totalParticles);

  for (let i = 0; i < totalParticles; i++) {
    const i3 = i * 3;
    
    // 使用指数分布，中心密集
    const radiusRandom = Math.pow(Math.random(), 0.3);
    const radius = radiusRandom * 2500;
    
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
    const normalizedDistance = distanceFromCenter / 2500;
    
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

  const material = new THREE.PointsMaterial({
    size: 2,
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
  const bgStarCount = 3000;
  const bgGeometry = new THREE.BufferGeometry();
  const bgPositions = new Float32Array(bgStarCount * 3);
  const bgColors = new Float32Array(bgStarCount * 3);
  
  for (let i = 0; i < bgStarCount; i++) {
    const i3 = i * 3;
    const radius = 2000 + Math.random() * 1500;
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
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const bgStars = new THREE.Points(bgGeometry, bgMaterial);
  scene.add(bgStars);
}

function createParticles() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // 随机选择一张图片
    const textureIndex = Math.floor(Math.random() * textures.length);
    const texture = textures[textureIndex];

    if (!texture) continue;

    // 创建精灵材质
    const material = new THREE.SpriteMaterial({
      map: texture,                           // 纹理贴图
      transparent: true,                      // 启用透明度
      opacity: 0.85,                          // 不透明度 (0-1)
      depthWrite: false,                      // 禁用深度写入，避免遮挡问题
      // blending: THREE.AdditiveBlending,       // 加法混合模式，产生发光效果
      sizeAttenuation: true                   // 根据距离缩放大小
    });

    // 创建精灵
    const sprite = new THREE.Sprite(material);

    // 球体分布：中心密集，边缘稀疏
    const sphereRadius = 1000; // 球体半径
    
    // 使用平方根分布，使中心密集
    // Math.random() 的平方根会产生更多接近0的值
    const radius = sphereRadius * Math.pow(Math.random(), 0.5);
    
    // 随机球面方向（均匀分布）
    const theta = Math.random() * Math.PI * 2; // 水平角度 0-2π
    const phi = Math.acos(2 * Math.random() - 1); // 垂直角度，均匀分布在球面
    
    // 球坐标转笛卡尔坐标
    sprite.position.x = radius * Math.sin(phi) * Math.cos(theta);
    sprite.position.y = radius * Math.sin(phi) * Math.sin(theta);
    sprite.position.z = radius * Math.cos(phi);

    // 随机大小，按纹理原始比例缩放
    const baseSize = 15 + Math.random() * 25;
    const aspectRatio = texture.image.width / texture.image.height;
    sprite.scale.set(baseSize * aspectRatio, baseSize, 1);

    // 存储原始数据用于交互
    sprite.userData = {
      originalScale: new THREE.Vector3(baseSize * aspectRatio, baseSize, 1)
    };

    scene.add(sprite);
    sprites.push(sprite);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  // 将鼠标位置转换为标准化设备坐标 (-1 到 +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // 使用射线投射器检测鼠标悬停的精灵
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sprites);

  // 检测当前悬停的精灵
  if (intersects.length > 0) {
    const newHovered = intersects[0].object;

    // 如果悬停对象改变了
    if (newHovered !== hoveredSprite) {
      // 恢复之前悬停的精灵
      if (hoveredSprite) {
        const originalScale = hoveredSprite.userData.originalScale;
        hoveredSprite.scale.x = originalScale.x;
        hoveredSprite.scale.y = originalScale.y;
        hoveredSprite.scale.z = originalScale.z;
        hoveredSprite.material.opacity = 0.85;
      }

      // 放大新悬停的精灵
      hoveredSprite = newHovered;
      const originalScale = hoveredSprite.userData.originalScale;
      hoveredSprite.scale.x = originalScale.x * 1.2;
      hoveredSprite.scale.y = originalScale.y * 1.2;
      hoveredSprite.scale.z = originalScale.z * 1.2;
      hoveredSprite.material.opacity = 1.0;
    }

    document.body.style.cursor = 'pointer';
    // controls.autoRotate = false;
  } else {
    // 鼠标离开所有精灵，恢复之前悬停的精灵
    if (hoveredSprite) {
      const originalScale = hoveredSprite.userData.originalScale;
      hoveredSprite.scale.x = originalScale.x;
      hoveredSprite.scale.y = originalScale.y;
      hoveredSprite.scale.z = originalScale.z;
      hoveredSprite.material.opacity = 0.85;
    }
    
    hoveredSprite = null;
    document.body.style.cursor = 'default';
    // controls.autoRotate = true;
  }
}

function onMouseClick(event) {
  // 将鼠标位置转换为标准化设备坐标
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // 检测点击的精灵
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sprites);

  if (intersects.length > 0) {
    const clickedSprite = intersects[0].object;

    // 计算相机目标位置：从场景中心(0,0,0)指向照片的方向，延伸到照片位置再往外200单位
    const sceneCenter = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3();
    direction.subVectors(clickedSprite.position, sceneCenter).normalize();

    // 目标位置 = 照片位置 + 方向 * 额外距离
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(clickedSprite.position).add(direction.multiplyScalar(50));

    // 使用 gsap 实现平滑移动
    animateCameraTo(targetPosition, clickedSprite.position);
  }
}

function animateCameraTo(targetPosition) {
  // 临时禁用 OrbitControls，避免冲突
  controls.enabled = false;

  // 场景中心（地心）
  const sceneCenter = new THREE.Vector3(0, 0, 0);

  // 使用 gsap 动画相机位置
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 1.5,
    ease: 'power2.inOut',  // 先慢后快再慢，平滑自然
    onUpdate: () => {
      // 动画过程中持续看向场景中心（地心）
      camera.lookAt(sceneCenter);
    },
    onComplete: () => {
      // 动画完成后，更新 controls 的 target 为场景中心并重新启用
      controls.target.copy(sceneCenter);
      controls.enabled = true;
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}
