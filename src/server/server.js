const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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