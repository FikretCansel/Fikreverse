import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

// Temel değişkenler
let camera, scene, renderer, controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let velocity = new THREE.Vector3();
let isOnGround = false;
const direction = new THREE.Vector3();
const socket = io({
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    upgrade: true,
    rememberUpgrade: true
});

// Bağlantı durumunu kontrol et
socket.on('connect', () => {
    console.log('Socket.IO bağlantısı kuruldu');
});

socket.on('connect_error', (error) => {
    console.error('Socket.IO bağlantı hatası:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Socket.IO bağlantısı kesildi:', reason);
});

// Fizik değişkenleri
const GRAVITY = -30;
const JUMP_FORCE = 12;
const WALK_SPEED = 150;
const PLAYER_HEIGHT = 2;
const raycaster = new THREE.Raycaster();

// Oyuncular ve nesneler
const players = new Map();
const objects = [];
let playerMesh;

// WebRTC ve video değişkenleri
let localStream;
let videoCanvas;
let videoContext;
const videoTextures = new Map();
const VIDEO_UPDATE_RATE = 100; // Her 100ms'de bir video güncellemesi

init();
animate();

async function init() {
    // Sahne oluşturma
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Gökyüzü mavisi

    // Kamera ayarları
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Zemin oluşturma
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228B22,
        roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    objects.push(ground);

    // Rastgele ağaçlar ve kayalar ekle
    for (let i = 0; i < 100; i++) {
        const isTree = Math.random() > 0.5;
        if (isTree) {
            const tree = createTree(
                Math.random() * 200 - 100,
                0,
                Math.random() * 200 - 100
            );
            objects.push(tree);
        } else {
            const rock = createRock(
                Math.random() * 200 - 100,
                0,
                Math.random() * 200 - 100
            );
            objects.push(rock);
        }
    }

    // Renderer ayarları
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Kontroller
    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');
    instructions.style.display = '';

    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        instructions.style.display = '';
    });

    // Mouse tıklaması ile pointer kilidini etkinleştir
    document.addEventListener('click', function() {
        if (!controls.isLocked) {
            controls.lock();
        }
    });

    // Hareket kontrolleri
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);

    // Pencere yeniden boyutlandırma
    window.addEventListener('resize', onWindowResize, false);

    // Oyuncu mesh'i oluştur
    createPlayerMesh();

    // Başlangıç pozisyonunu yerden başlat
    camera.position.y = PLAYER_HEIGHT;

    // Video akışını başlat
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 320,
                height: 240,
                frameRate: { ideal: 10, max: 15 }
            }
        });
        document.getElementById('localVideo').srcObject = localStream;

        // Video canvas'ı oluştur
        videoCanvas = document.createElement('canvas');
        videoCanvas.width = 320;
        videoCanvas.height = 240;
        videoContext = videoCanvas.getContext('2d');

        // Video stream göndermeyi başlat
        setInterval(sendVideoFrame, VIDEO_UPDATE_RATE);
    } catch (err) {
        console.error('Kamera erişim hatası:', err);
    }
}

function createPlayerMesh() {
    // Süper kahraman çocuk karakteri oluşturma
    const character = new THREE.Group();
    character.scale.set(0.5, 0.5, 0.5); // Karakteri yarı boyuta küçült

    // Vücut (mavi süper kahraman kostümü)
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    character.add(body);

    // Kafa
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.25;
    character.add(head);

    // Maske
    const maskGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.6);
    const maskMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const mask = new THREE.Mesh(maskGeometry, maskMaterial);
    mask.position.y = 3.3;
    mask.position.z = 0.3;
    character.add(mask);

    // Pelerin
    const capeGeometry = new THREE.BoxGeometry(2, 3, 0.1);
    const capeMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const cape = new THREE.Mesh(capeGeometry, capeMaterial);
    cape.position.y = 2;
    cape.position.z = -0.6;
    character.add(cape);

    // Kollar
    const armGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.x = -1;
    leftArm.position.y = 2.5;
    character.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.x = 1;
    rightArm.position.y = 2.5;
    character.add(rightArm);

    // Bacaklar
    const legGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.x = -0.4;
    leftLeg.position.y = 0.75;
    character.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.x = 0.4;
    rightLeg.position.y = 0.75;
    character.add(rightLeg);

    // "S" logosu göğüste
    const logoGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
    const logoMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.y = 2.5;
    logo.position.z = 0.6;
    character.add(logo);

    // Video paneli ekle
    const videoPanel = createVideoPanel();
    character.add(videoPanel);

    playerMesh = character;
    scene.add(playerMesh);

    // Karakter animasyonları için zamanlayıcı
    let time = 0;
    function animateCharacter() {
        time += 0.1;
        
        // Yürüme animasyonu
        if (moveForward || moveBackward || moveLeft || moveRight) {
            leftLeg.rotation.x = Math.sin(time * 2) * 0.3;
            rightLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.3;
            leftArm.rotation.x = Math.sin(time * 2 + Math.PI) * 0.3;
            rightArm.rotation.x = Math.sin(time * 2) * 0.3;
            cape.rotation.x = Math.sin(time) * 0.1;
            cape.position.z = -0.6 - Math.abs(Math.sin(time) * 0.2);
        }
    }

    // Animate fonksiyonuna animasyon ekleme
    const originalAnimate = animate;
    animate = function() {
        animateCharacter();
        originalAnimate();
    };
}

function createTree(x, y, z) {
    const tree = new THREE.Group();

    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 4;
    leaves.castShadow = true;
    leaves.receiveShadow = true;

    tree.add(trunk);
    tree.add(leaves);
    tree.position.set(x, y, z);
    scene.add(tree);
    
    // Çarpışma kutusu ekle
    const boundingBox = new THREE.Box3().setFromObject(tree);
    tree.boundingBox = boundingBox;
    
    return tree;
}

function createRock(x, y, z) {
    const geometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(geometry, material);
    rock.position.set(x, y, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);

    // Çarpışma kutusu ekle
    const boundingBox = new THREE.Box3().setFromObject(rock);
    rock.boundingBox = boundingBox;

    return rock;
}

function checkCollision(position, objects) {
    // Karakter etrafında çarpışma kutusu oluştur
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        position,
        new THREE.Vector3(1, PLAYER_HEIGHT, 1)
    );

    for (const object of objects) {
        if (object.boundingBox && playerBox.intersectsBox(object.boundingBox)) {
            return true;
        }
    }
    return false;
}

function checkGroundCollision() {
    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.direction.set(0, -1, 0);

    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        const distance = intersects[0].distance;
        if (distance <= PLAYER_HEIGHT) {
            return true;
        }
    }
    return false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump === true) {
                velocity.y = JUMP_FORCE;
                canJump = false;
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function onMouseDown(event) {
    if (event.button === 0) { // Sol tık
        // En yakın oyuncuyu bul ve saldır
        let closestPlayer = null;
        let closestDistance = Infinity;
        
        players.forEach((player, id) => {
            if (id !== socket.id) {
                const distance = camera.position.distanceTo(player.mesh.position);
                if (distance < closestDistance && distance < 10) {
                    closestDistance = distance;
                    closestPlayer = player;
                }
            }
        });

        if (closestPlayer) {
            socket.emit('attack', closestPlayer.id);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked === true) {
        const delta = 0.016; // ~60fps

        // Yerçekimi ve dikey hareket
        isOnGround = checkGroundCollision();
        
        if (isOnGround) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        } else {
            velocity.y += GRAVITY * delta;
        }

        // Yatay hareket
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight); // Değişiklik burada: moveRight ve moveLeft'in yerlerini değiştirdik
        direction.normalize();

        // Hareket vektörünü kamera yönüne göre dönüştürme
        if (moveForward || moveBackward || moveLeft || moveRight) {
            // Kameranın yönünü al
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            
            // Sağ vektörünü hesapla (kamera yönüne dik)
            const rightVector = new THREE.Vector3();
            rightVector.crossVectors(camera.up, cameraDirection).normalize();

            // İleri/geri hareket için kamera yönünü kullan (y eksenini sıfırla)
            cameraDirection.y = 0;
            cameraDirection.normalize();

            // Hareket yönünü hesapla
            const moveDirection = new THREE.Vector3();
            moveDirection.addScaledVector(cameraDirection, direction.z);
            moveDirection.addScaledVector(rightVector, direction.x);
            moveDirection.normalize();

            const speedMultiplier = isOnGround ? 1 : 0.3;
            velocity.x += moveDirection.x * WALK_SPEED * speedMultiplier * delta;
            velocity.z += moveDirection.z * WALK_SPEED * speedMultiplier * delta;
        }

        // Pozisyon güncelleme ve çarpışma kontrolü
        const oldPosition = camera.position.clone();
        
        // X ekseni hareketi
        camera.position.x += velocity.x * delta;
        if (checkCollision(camera.position, objects)) {
            camera.position.x = oldPosition.x;
            velocity.x = 0;
        }

        // Z ekseni hareketi
        camera.position.z += velocity.z * delta;
        if (checkCollision(camera.position, objects)) {
            camera.position.z = oldPosition.z;
            velocity.z = 0;
        }

        // Y ekseni hareketi
        camera.position.y += velocity.y * delta;
        if (camera.position.y < PLAYER_HEIGHT) {
            camera.position.y = PLAYER_HEIGHT;
            velocity.y = 0;
            isOnGround = true;
            canJump = true;
        }

        // Oyuncu modelini kamera pozisyonuna göre güncelle
        playerMesh.position.copy(camera.position);
        playerMesh.position.y -= PLAYER_HEIGHT * 1.5;

        // Kamera yönünü al ve karakteri döndür
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        const rotation = Math.atan2(cameraDirection.x, cameraDirection.z);
        playerMesh.rotation.y = rotation;

        // Oyuncu pozisyonunu ve rotasyonunu sunucuya gönder
        socket.emit('playerMovement', {
            position: camera.position.clone(),
            rotation: { y: rotation }
        });

        // Video panellerini kameraya döndür
        players.forEach((player) => {
            if (player.videoPanel) {
                const cameraPosition = camera.position.clone();
                player.videoPanel.lookAt(cameraPosition);
                // Video dokusunu güncelle
                if (player.videoPanel.material.map) {
                    player.videoPanel.material.map.needsUpdate = true;
                }
            }
        });
    }

    renderer.render(scene, camera);
}

// Socket.io olayları
socket.on('currentPlayers', (serverPlayers) => {
    serverPlayers.forEach((playerData) => {
        if (playerData.id !== socket.id) {
            addOtherPlayer(playerData);
        }
    });
});

socket.on('newPlayer', (playerData) => {
    addOtherPlayer(playerData);
});

socket.on('playerMoved', (playerData) => {
    const player = players.get(playerData.id);
    if (player && playerData.id !== socket.id) {
        // Son pozisyon ve yeni pozisyon arasındaki farkı hesapla
        const newPosition = new THREE.Vector3(
            playerData.position.x,
            playerData.position.y - PLAYER_HEIGHT * 1.5 + 1,
            playerData.position.z
        );

        // Hareket miktarını hesapla
        if (player.lastPosition) {
            const moveAmount = newPosition.distanceTo(player.lastPosition);
            player.isMoving = moveAmount > 0.1; // Hareket eşiği

            // Eğer hareket ediyorsa animasyonu güncelle
            if (player.isMoving) {
                player.animationTime += 0.1;
                
                // Yürüme animasyonu
                player.leftLeg.rotation.x = Math.sin(player.animationTime * 5) * 0.4;
                player.rightLeg.rotation.x = Math.sin(player.animationTime * 5 + Math.PI) * 0.4;
                player.leftArm.rotation.x = Math.sin(player.animationTime * 5 + Math.PI) * 0.4;
                player.rightArm.rotation.x = Math.sin(player.animationTime * 5) * 0.4;
                player.cape.rotation.x = Math.sin(player.animationTime * 2) * 0.1;
                player.cape.position.z = -0.6 - Math.abs(Math.sin(player.animationTime * 2) * 0.2);
            } else {
                // Hareket etmiyorsa uzuvları normal pozisyona getir
                player.leftLeg.rotation.x = 0;
                player.rightLeg.rotation.x = 0;
                player.leftArm.rotation.x = 0;
                player.rightArm.rotation.x = 0;
                player.cape.rotation.x = 0;
                player.cape.position.z = -0.6;
            }
        }

        // Pozisyonu güncelle
        player.mesh.position.lerp(newPosition, 0.3);
        player.lastPosition = newPosition.clone();

        // Rotasyonu güncelle
        if (playerData.rotation) {
            player.mesh.rotation.y = playerData.rotation.y;
        }
    }
});

socket.on('playerDamaged', (data) => {
    if (data.id === socket.id) {
        document.getElementById('health').textContent = `Sağlık: ${data.health}`;
    }
});

socket.on('playerDisconnected', (playerId) => {
    const player = players.get(playerId);
    if (player) {
        scene.remove(player.mesh);
        players.delete(playerId);
    }

    // Video bağlantısını temizle
    const videoElement = videoElements.get(playerId);
    if (videoElement) {
        videoElement.remove();
        videoElements.delete(playerId);
    }
    
    videoTextures.delete(playerId);
});

function addOtherPlayer(playerData) {
    // Diğer oyuncular için de aynı süper kahraman modelini kullan
    const character = new THREE.Group();
    character.scale.set(0.5, 0.5, 0.5); // Diğer oyuncuların karakterlerini de küçült

    // Vücut (yeşil süper kahraman kostümü - diğer oyuncular için farklı renk)
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00cc66 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    character.add(body);

    // Kafa
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.25;
    character.add(head);

    // Maske
    const maskGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.6);
    const maskMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const mask = new THREE.Mesh(maskGeometry, maskMaterial);
    mask.position.y = 3.3;
    mask.position.z = 0.3;
    character.add(mask);

    // Pelerin
    const capeGeometry = new THREE.BoxGeometry(2, 3, 0.1);
    const capeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const cape = new THREE.Mesh(capeGeometry, capeMaterial);
    cape.position.y = 2;
    cape.position.z = -0.6;
    character.add(cape);

    // Kollar ve bacaklar
    const limbGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const limbMaterial = new THREE.MeshPhongMaterial({ color: 0x00cc66 });
    
    const leftArm = new THREE.Mesh(limbGeometry, limbMaterial);
    leftArm.position.x = -1;
    leftArm.position.y = 2.5;
    character.add(leftArm);
    
    const rightArm = new THREE.Mesh(limbGeometry, limbMaterial);
    rightArm.position.x = 1;
    rightArm.position.y = 2.5;
    character.add(rightArm);
    
    const leftLeg = new THREE.Mesh(limbGeometry, limbMaterial);
    leftLeg.position.x = -0.4;
    leftLeg.position.y = 0.75;
    character.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(limbGeometry, limbMaterial);
    rightLeg.position.x = 0.4;
    rightLeg.position.y = 0.75;
    character.add(rightLeg);

    // Video paneli ekle
    const videoPanel = createVideoPanel();
    character.add(videoPanel);

    // Pozisyonu ayarla ve karakteri yukarı kaldır
    const position = new THREE.Vector3(
        playerData.position.x,
        playerData.position.y - PLAYER_HEIGHT * 1.5 + 1, // Karakteri yukarı kaldır
        playerData.position.z
    );
    character.position.copy(position);
    scene.add(character);

    // Oyuncuyu kaydet
    players.set(playerData.id, {
        id: playerData.id,
        mesh: character,
        leftLeg: leftLeg,
        rightLeg: rightLeg,
        leftArm: leftArm,
        rightArm: rightArm,
        cape: cape,
        lastPosition: null,
        isMoving: false,
        animationTime: 0,
        videoPanel: videoPanel
    });
}

function createVideoPanel() {
    const geometry = new THREE.PlaneGeometry(2, 1.5);
    const texture = new THREE.Texture();
    const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const panel = new THREE.Mesh(geometry, material);
    panel.position.y = 5;
    return panel;
}

function sendVideoFrame() {
    if (!localStream || !videoContext) return;

    const video = document.getElementById('localVideo');
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        videoContext.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
        const imageData = videoCanvas.toDataURL('image/jpeg', 0.5);
        socket.emit('video-stream', imageData);
    }
}

// Socket.io video olayı
socket.on('video-stream', (data) => {
    const player = players.get(data.id);
    if (player && player.videoPanel) {
        // Base64 görüntüyü texture'a dönüştür
        const image = new Image();
        image.onload = function() {
            if (!videoTextures.has(data.id)) {
                videoTextures.set(data.id, new THREE.Texture(image));
            }
            const texture = videoTextures.get(data.id);
            texture.image = image;
            texture.needsUpdate = true;
            player.videoPanel.material.map = texture;
            player.videoPanel.material.needsUpdate = true;
        };
        image.src = data.imageData;
    }
});