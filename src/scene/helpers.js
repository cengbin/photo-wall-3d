import * as THREE from 'three';

export function addHelpers(scene) {
  // 坐标轴辅助器 (红色=X轴, 绿色=Y轴, 蓝色=Z轴)
  const axesHelper = new THREE.AxesHelper(10000);
  scene.add(axesHelper);

  // 网格辅助器 (地面网格 - 红色)
  const gridHelper = new THREE.GridHelper(2000, 20, 0x880000, 0xffffff);
  scene.add(gridHelper);
}
