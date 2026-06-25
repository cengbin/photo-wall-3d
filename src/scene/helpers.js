import * as THREE from 'three';
import {
  AXES_HELPER_SIZE,
  GRID_HELPER_CENTER_COLOR,
  GRID_HELPER_DIVISIONS,
  GRID_HELPER_GRID_COLOR,
  GRID_HELPER_SIZE
} from '../config/constants.js';

export function addHelpers(scene) {
  // 坐标轴辅助器 (红色=X轴, 绿色=Y轴, 蓝色=Z轴)
  const axesHelper = new THREE.AxesHelper(AXES_HELPER_SIZE);
  scene.add(axesHelper);

  // 网格辅助器 (地面网格 - 红色)
  const gridHelper = new THREE.GridHelper(
    GRID_HELPER_SIZE,
    GRID_HELPER_DIVISIONS,
    GRID_HELPER_CENTER_COLOR,
    GRID_HELPER_GRID_COLOR
  );
  scene.add(gridHelper);
}
