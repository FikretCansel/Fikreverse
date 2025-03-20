const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const WORLD_OBJECTS = require('./worldObjects');

const app = express();
const server = http.createServer(app);

// Express middleware for WebSocket headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Socket.IO ayarları
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8
});

app.use(express.static(path.join(__dirname, '../../public')));

const players = new Map();

// Sabit spawn noktası
const SPAWN_POINT = { x: 0, y: 2, z: 0 };

io.on('connection', (socket) => {
    console.log('Oyuncu bağlandı:', socket.id);
    
    // Dünya nesnelerini bağlanan oyuncuya gönder
    socket.emit('worldObjects', WORLD_OBJECTS);

    socket.on('playerJoin', (playerName) => {
        // Yeni oyuncuyu sabit spawn noktasında oluştur
        players.set(socket.id, {
            id: socket.id,
            name: playerName,
            position: { ...SPAWN_POINT },
            rotation: { y: 0 },
            health: 100,
            lastDamageTime: 0
        });

        // Mevcut oyuncuları yeni oyuncuya gönder
        socket.emit('currentPlayers', Array.from(players.values()));
        
        // Yeni oyuncuyu diğer oyunculara bildir
        socket.broadcast.emit('newPlayer', players.get(socket.id));
    });

    // Video stream olayı
    socket.on('video-stream', (imageData) => {
        // Video görüntüsünü diğer oyunculara ilet
        socket.broadcast.emit('video-stream', {
            id: socket.id,
            imageData: imageData
        });
    });

    // WebRTC sinyalleşme
    socket.on('video-offer', (offer, targetId) => {
        socket.to(targetId).emit('video-offer', offer, socket.id);
    });

    socket.on('video-answer', (answer, targetId) => {
        socket.to(targetId).emit('video-answer', answer, socket.id);
    });

    socket.on('new-ice-candidate', (candidate, targetId) => {
        socket.to(targetId).emit('new-ice-candidate', candidate, socket.id);
    });

    socket.on('playerMovement', (movementData) => {
        const player = players.get(socket.id);
        if (player) {
            player.position = movementData.position;
            player.rotation = movementData.rotation; // Rotasyonu kaydediyoruz
            // Hareket güncellemesini TÜM oyunculara gönder (broadcast yerine io.emit kullan)
            io.emit('playerMoved', {
                id: socket.id,
                position: player.position,
                rotation: player.rotation // Rotasyonu da gönderiyoruz
            });
        }
    });

    socket.on('attack', (targetId) => {
        const target = players.get(targetId);
        if (target) {
            const now = Date.now();
            target.health -= 10;
            target.lastDamageTime = now;

            // Sağlık 0 veya altına düştüyse ölüm durumu
            if (target.health <= 0 && target.name !== 'fikretbaba') {
                io.emit('playerDied', {
                    id: targetId,
                    name: target.name
                });
            } else {
                io.emit('playerDamaged', {
                    id: targetId,
                    health: target.health,
                    timestamp: now
                });
            }
        }
    });

    // Sağlık rejenerasyonu için interval
    const healthRegenInterval = setInterval(() => {
        const player = players.get(socket.id);
        if (player && player.health < 100) {
            const now = Date.now();
            // Son hasardan 3 saniye sonra iyileşmeye başla
            if (now - player.lastDamageTime > 3000) {
                player.health = Math.min(100, player.health + 5);
                io.emit('playerHealed', {
                    id: socket.id,
                    health: player.health
                });
            }
        }
    }, 1000); // Her saniye kontrol et

    socket.on('disconnect', () => {
        clearInterval(healthRegenInterval);
        console.log('Oyuncu ayrıldı:', socket.id);
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});