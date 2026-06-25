import * as THREE from 'three';
import {
  PHOTO_BORDER_LINE_WIDTH,
  PHOTO_COUNT,
  PHOTO_MATERIAL_OPACITY,
  PHOTO_SPHERE_RADIUS
} from '../config/constants.js';

export function createPhotos(scene, textures, sprites) {
  for (let i = 0; i < PHOTO_COUNT; i++) {
    // 随机选择一张图片
    const textureIndex = Math.floor(Math.random() * textures.length);
    const texture = textures[textureIndex];

    if (!texture) continue;

    // 创建精灵材质
    const material = new THREE.SpriteMaterial({
      map: texture,                           // 纹理贴图
      transparent: true,                      // 启用透明度
      opacity: PHOTO_MATERIAL_OPACITY,        // 不透明度 (0-1)
      depthWrite: false,                      // 禁用深度写入，避免遮挡问题
      // blending: THREE.AdditiveBlending,       // 加法混合模式，产生发光效果
      sizeAttenuation: true                   // 根据距离缩放大小
    });

    // 创建精灵
    const sprite = new THREE.Sprite(material);

    // 球体分布：中心密集，边缘稀疏
    const sphereRadius = PHOTO_SPHERE_RADIUS; // 球体半径
    
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

    // 创建边框线
    const borderGeometry = new THREE.BufferGeometry();
    const borderWidth = baseSize * aspectRatio;
    const borderHeight = baseSize;
    const borderVertices = new Float32Array([
      -borderWidth / 2, -borderHeight / 2, 0,
      borderWidth / 2, -borderHeight / 2, 0,
      borderWidth / 2, borderHeight / 2, 0,
      -borderWidth / 2, borderHeight / 2, 0,
      -borderWidth / 2, -borderHeight / 2, 0
    ]);
    borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderVertices, 3));
    
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: PHOTO_BORDER_LINE_WIDTH,
      transparent: true,
      opacity: 0
    });
    
    const borderLine = new THREE.Line(borderGeometry, borderMaterial);
    borderLine.position.copy(sprite.position);
    scene.add(borderLine);

    // 存储原始数据用于交互
    sprite.userData = {
      originalScale: new THREE.Vector3(baseSize * aspectRatio, baseSize, 1),
      borderLine: borderLine
    };

    scene.add(sprite);
    sprites.push(sprite);
  }
}
