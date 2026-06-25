import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import {addHelpers} from './scene/helpers.js';
import {createStarField} from './scene/starField.js';
import {createPhotos} from './scene/photos.js';


let scene, camera, renderer, controls;
let sprites = [];
let textures = [];
let raycaster, mouse;
let hoveredSprite = null;
let clickedSprite = null;
let imagesData = null;


init();

function init() {
  const container = document.getElementById('container');

  // 场景
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0008);

  // 相机
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 2, 2000);
  camera.position.z = 2000;

  // 渲染器
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;              // 启用阻尼（惯性），使控制更平滑
  controls.dampingFactor = 0.05;              // 阻尼系数，值越小惯性越大
  controls.autoRotate = true;                 // 自动旋转
  controls.autoRotateSpeed = 0.1;             // 自动旋转速度
  controls.minDistance = 100;                 // 最小缩放距离
  controls.maxDistance = 3000;                // 最大缩放距离

  // 先加载 JSON 文件
  fetch('resource/images-data.json')
    .then(response => response.json())
    .then(data => {
      imagesData = data;
      console.log(`加载了 ${imagesData.total} 个图片信息`);

      // 加载所有图片纹理
      const textureLoader = new THREE.TextureLoader();
      let loadedCount = 0;

      imagesData.images.forEach((imageInfo, index) => {
        textureLoader.load(
          imageInfo.path,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            textures[index] = texture;
            loadedCount++;

            if (loadedCount === imagesData.total) {
              createPhotos(scene, textures, sprites);
              document.getElementById('loading').classList.add('hidden');
              animate();
            }
          },
          undefined,
          (error) => {
            console.error('Failed to load:', imageInfo.filename, error);
            loadedCount++;
            if (loadedCount === imagesData.total) {
              createPhotos(scene, textures, sprites);
              document.getElementById('loading').classList.add('hidden');
              animate();
            }
          }
        );
      });
    })
    .catch(error => {
      console.error('Failed to load images-data.json:', error);
      document.getElementById('loading').innerHTML = '加载图片数据失败';
    });

  // 添加辅助工具（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    addHelpers(scene);
  }

  // 创建宇宙星空背景
  createStarField(scene);

  // 初始化射线投射器和鼠标向量
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 事件监听
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onMouseClick);
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
      // 恢复之前悬停的精灵（跳过当前点击的精灵）
      if (hoveredSprite && hoveredSprite !== clickedSprite) {
        hoveredSprite.material.opacity = 0.85;

        // 隐藏边框线
        if (hoveredSprite.userData.borderLine) {
          hoveredSprite.userData.borderLine.material.opacity = 0;
        }
      }

      // 设置新悬停的精灵
      hoveredSprite = newHovered;
      hoveredSprite.material.opacity = 1.0;

      // 显示边框线
      if (hoveredSprite.userData.borderLine) {
        const borderLine = hoveredSprite.userData.borderLine;
        borderLine.position.copy(hoveredSprite.position);
        borderLine.material.opacity = 1.0;
      }
    }

    document.body.style.cursor = 'pointer';
    // controls.autoRotate = false;
  } else {
    // 鼠标离开所有精灵，恢复之前悬停的精灵（跳过当前点击的精灵）
    if (hoveredSprite && hoveredSprite !== clickedSprite) {
      hoveredSprite.material.opacity = 0.85;

      // 隐藏边框线
      if (hoveredSprite.userData.borderLine) {
        hoveredSprite.userData.borderLine.material.opacity = 0;
      }
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
    const newClicked = intersects[0].object;

    // 恢复之前点击的精灵
    if (clickedSprite && clickedSprite !== newClicked) {
      clickedSprite.material.opacity = 0.85;
      if (clickedSprite.userData.borderLine) {
        clickedSprite.userData.borderLine.material.opacity = 0;
      }
    }

    // 设置新点击的精灵
    clickedSprite = newClicked;
    clickedSprite.material.opacity = 1.0;
    if (clickedSprite.userData.borderLine) {
      clickedSprite.userData.borderLine.position.copy(clickedSprite.position);
      clickedSprite.userData.borderLine.material.opacity = 1.0;
    }

    // 停止自动旋转
    controls.autoRotate = false;

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

      // 监听用户主动操作控制器时，恢复点击的精灵和自动旋转
      const resetClicked = () => {
        if (clickedSprite) {
          clickedSprite.material.opacity = 0.85;
          if (clickedSprite.userData.borderLine) {
            clickedSprite.userData.borderLine.material.opacity = 0;
          }
          clickedSprite = null;
        }
        controls.autoRotate = true;
        renderer.domElement.removeEventListener('mousedown', resetClicked);
        renderer.domElement.removeEventListener('wheel', resetClicked);
        renderer.domElement.removeEventListener('touchstart', resetClicked);
      };
      renderer.domElement.addEventListener('mousedown', resetClicked);
      renderer.domElement.addEventListener('wheel', resetClicked);
      renderer.domElement.addEventListener('touchstart', resetClicked);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  // 更新边框线朝向，使其始终面向相机
  if (hoveredSprite && hoveredSprite.userData.borderLine) {
    hoveredSprite.userData.borderLine.quaternion.copy(camera.quaternion);
  }
  if (clickedSprite && clickedSprite.userData.borderLine) {
    clickedSprite.userData.borderLine.quaternion.copy(camera.quaternion);
  }

  controls.update();
  renderer.render(scene, camera);
}
