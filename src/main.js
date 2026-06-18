import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const imageFiles = Array.from({ length: 64 }, (_, i) => `${i + 1}.png`);

const PARTICLE_COUNT = 1000;

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
    camera.position.z = 1000;

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 控制器
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;              // 启用阻尼（惯性），使控制更平滑
    controls.dampingFactor = 0.05;              // 阻尼系数，值越小惯性越大
    controls.autoRotate = true;                 // 自动旋转
    controls.autoRotateSpeed = 0.3;             // 自动旋转速度
    controls.minDistance = 100;                 // 最小缩放距离
    controls.maxDistance = 2000;                // 最大缩放距离

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

    // 初始化射线投射器和鼠标向量
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 事件监听
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
}

function addHelpers() {
    // 坐标轴辅助器 (红色=X轴, 绿色=Y轴, 蓝色=Z轴)
    const axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);

    // 网格辅助器 (地面网格)
    const gridHelper = new THREE.GridHelper(2000, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
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
            // transparent: true,                      // 启用透明度
            // opacity: 0.9,                        // 不透明度 (0-1)
            depthWrite: false,                      // 禁用深度写入，避免遮挡问题
            // blending: THREE.AdditiveBlending,       // 加法混合模式，产生发光效果
            sizeAttenuation: true                   // 根据距离缩放大小
        });

        // 创建精灵
        const sprite = new THREE.Sprite(material);

        // 随机位置（类似示例的分布）
        sprite.position.x = Math.random() * 2000 - 1000;
        sprite.position.y = Math.random() * 2000 - 1000;
        sprite.position.z = Math.random() * 2000 - 1000;

        // 随机大小，按纹理原始比例缩放
        const baseSize = 15 + Math.random() * 25;
        const aspectRatio = texture.image.width / texture.image.height;
        sprite.scale.set(baseSize * aspectRatio, baseSize, 1);

        // 存储原始数据用于动画和交互
        sprite.userData = {
            originalX: sprite.position.x,
            originalY: sprite.position.y,
            originalZ: sprite.position.z,
            originalScale: new THREE.Vector3(baseSize * aspectRatio, baseSize, 1),
            speed: 0.5 + Math.random() * 1.5,
            offset: Math.random() * Math.PI * 2
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

    // 恢复之前悬停的精灵
    if (hoveredSprite) {
        // 移除边缘发光效果
        hoveredSprite.material.color.setHex(0xffffff);
    }

    // 应用边缘发光效果到当前悬停的精灵
    if (intersects.length > 0) {
        hoveredSprite = intersects[0].object;
        // 添加边缘发光效果（使用颜色叠加）
        hoveredSprite.material.color.setHex(0x00ffff); // 青色发光
        document.body.style.cursor = 'pointer';
        // 停止自动旋转
        controls.autoRotate = false;
    } else {
        hoveredSprite = null;
        document.body.style.cursor = 'default';
        // 恢复自动旋转
        controls.autoRotate = true;
    }
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
}
