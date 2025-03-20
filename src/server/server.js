const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO ayarları
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["content-type"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 20000,
    pingInterval: 25000
});

app.use(express.static(path.join(__dirname, '../../public')));

const players = new Map();

// Sabit spawn noktası
const SPAWN_POINT = { x: 0, y: 2, z: 0 };

io.on('connection', (socket) => {
    console.log('Oyuncu bağlandı:', socket.id);
    
    // Yeni oyuncuyu sabit spawn noktasında oluştur
    players.set(socket.id, {
        id: socket.id,
        position: { ...SPAWN_POINT },
        rotation: { y: 0 }, // Rotasyon bilgisini ekledik
        health: 100
    });

    // Mevcut oyuncuları yeni oyuncuya gönder
    socket.emit('currentPlayers', Array.from(players.values()));
    
    // Yeni oyuncuyu diğer oyunculara bildir
    socket.broadcast.emit('newPlayer', players.get(socket.id));

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
            target.health -= 10;
            io.emit('playerDamaged', {
                id: targetId,
                health: target.health
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Oyuncu ayrıldı:', socket.id);
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});