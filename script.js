import * as THREE from 'https://threejs.org/build/three.module.js';
import TWEEN from './tween.esm.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000); // Arka plan rengini siyah yap
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

const cubeSize = 1;
const spacing = 0.1; // Boşluk

const rubikCube = new THREE.Object3D();
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff6600, 0xffffff];
const cubes = [];

// Küpleri oluştur ve sahneye ekle
for (let x = 0; x < 4; x++) {
  for (let y = 0; y < 4; y++) {
    for (let z = 0; z < 4; z++) {
      const cubeMaterials = [
        new THREE.MeshStandardMaterial({ color: colors[0] }),
        new THREE.MeshStandardMaterial({ color: colors[1] }),
        new THREE.MeshStandardMaterial({ color: colors[2] }),
        new THREE.MeshStandardMaterial({ color: colors[3] }),
        new THREE.MeshStandardMaterial({ color: colors[4] }),
        new THREE.MeshStandardMaterial({ color: colors[5] })
      ];

      const cube = new THREE.Mesh(new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize), cubeMaterials);
      cube.position.set((cubeSize + spacing) * (x - 1.5), (cubeSize + spacing) * (y - 1.5), (cubeSize + spacing) * (z - 1.5));

      // Küpleri seçilebilir hale getir
      cube.userData = { x, y, z };
      cube.castShadow = true;
      cube.receiveShadow = true;

      cube.addEventListener('click', (event) => {
        handleCubeClick(event.target.userData);
      });

      rubikCube.add(cube);
      cubes.push(cube);
    }
  }
}

// Giriş animasyonu
rubikCube.position.set(0, -10, 0);
new TWEEN.Tween(rubikCube.position)
  .to({ x: 0, y: 0, z: 0 }, 1000)
  .easing(TWEEN.Easing.Exponential.Out)
  .start();

scene.add(rubikCube);

// Işıkları ekle
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Kamera pozisyonu
camera.position.z = 20;

// Küpleri döndürme değişkenleri
let isDragging = false;
let selectedRow = 0;
let selectedColumn = 0;
let previousMousePosition = { x: 0, y: 0 };

// Fare olayları
document.addEventListener('mousedown', (event) => {
  if (event.button === 0) {
    isDragging = true;
    selectRowOrColumn(event);
  }
});

document.addEventListener('mousemove', (event) => {
  const deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };

  if (isDragging) {
    selectRowOrColumn(event);
    const deltaRotationQuaternion = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(toRadians(deltaMove.y * 1), toRadians(deltaMove.x * 1), 0, 'XYZ'));

    rubikCube.quaternion.multiplyQuaternions(deltaRotationQuaternion, rubikCube.quaternion);
  }

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

document.addEventListener('wheel', (event) => {
  const delta = event.deltaY;

  if (delta > 0) {
    rotateRow(selectedRow, true);
  } else {
    rotateColumn(selectedColumn, true);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'x') {
    camera.position.z -= 1;
  } else if (event.key === 'z') {
    camera.position.z += 1;
  } else if (event.key === 'r') {
    changeSelectedRowAndColumn();
  } else if (event.key === 'k') {
    shuffleRubikCube();
  }
});

// Karıştırma butonu ve fonksiyonu
const shuffleButton = document.getElementById('shuffle-button');
shuffleButton.addEventListener('click', () => {
  shuffleRubikCube();
});

// Küp tıklama işlemi
function handleCubeClick(position) {
  console.log(`Tıklanan Küpün Pozisyonu: x=${position.x}, y=${position.y}, z=${position.z}`);
  // Buraya tıklanan küp ile yapmak istediğiniz işlemleri ekleyebilirsiniz.
}

// Diğer fonksiyonlar
function selectRowOrColumn(event) {
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

  const intersects = raycaster.intersectObjects(rubikCube.children, true);

  if (intersects.length > 0) {
    const selectedCube = intersects[0].object;

    const directionVector = new THREE.Vector3();
    selectedCube.getWorldPosition(directionVector);
    directionVector.sub(camera.position).normalize();

    const axisX = new THREE.Vector3(1, 0, 0);
    const axisY = new THREE.Vector3(0, 1, 0);

    const angleX = directionVector.angleTo(axisX);
    const angleY = directionVector.angleTo(axisY);

    if (angleX < angleY) {
      selectedColumn = Math.round(selectedCube.position.x + 1.5);
      toggleSelector('column-selector', selectedColumn);
    } else {
      selectedRow = Math.round(selectedCube.position.y + 1.5);
      toggleSelector('row-selector', selectedRow);
    }
  }
}

function toggleSelector(selector, index) {
    const selectedElement = document.querySelector(`.${selector}`);
    selectedElement.classList.toggle('active', !selectedElement.classList.contains('active'));
  }
  

function rotateRow(row, clockwise) {
  const cubesInRow = cubes.filter(cube => Math.round(cube.position.y + 1.5) === row);
  const rotationAngle = clockwise ? Math.PI / 2 : -Math.PI / 2;

  const rotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationAngle, 0));

  cubesInRow.forEach(cube => {
    cube.applyQuaternion(rotationQuaternion);
  });
}

function rotateColumn(column, clockwise) {
  const cubesInColumn = cubes.filter(cube => Math.round(cube.position.x + 1.5) === column);
  const rotationAngle = clockwise ? Math.PI / 2 : -Math.PI / 2;

  const rotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotationAngle, 0, 0));

  cubesInColumn.forEach(cube => {
    cube.applyQuaternion(rotationQuaternion);
  });
}

function changeSelectedRowAndColumn() {
  selectedRow = Math.floor(Math.random() * 4) + 1;
  selectedColumn = Math.floor(Math.random() * 4) + 1;

  toggleSelector('row-selector', selectedRow);
  toggleSelector('column-selector', selectedColumn);
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  renderer.render(scene, camera);
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function shuffleRubikCube() {
  const moves = ['rotateRow', 'rotateColumn'];
  const randomMoveCount = Math.floor(Math.random() * 20) + 10;

  function performRandomMove() {
    const selectedMove = moves[Math.floor(Math.random() * moves.length)];

    if (selectedMove === 'rotateRow') {
      const selectedRow = Math.floor(Math.random() * 4) + 1;
      const clockwise = Math.random() < 0.5;
      rotateRow(selectedRow, clockwise);
    } else if (selectedMove === 'rotateColumn') {
      const selectedColumn = Math.floor(Math.random() * 4) + 1;
      const clockwise = Math.random() < 0.5;
      rotateColumn(selectedColumn, clockwise);
    }
  }

  function performMovesSequentially(index) {
    if (index < randomMoveCount) {
      performRandomMove();
      setTimeout(() => {
        performMovesSequentially(index + 1);
      }, 100); // 100ms aralıklarla işlem yap
    }
  }

  performMovesSequentially(0);
}

animate();
