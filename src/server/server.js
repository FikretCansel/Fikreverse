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

// Fikret NPC'sinin pozisyonunu rastgele belirle
function getRandomPosition() {
    return {
        x: -150 + Math.random() * 300,
        y: 2,
        z: -150 + Math.random() * 300
    };
}

// Fikret NPC'si
let fikretNPC = {
    position: getRandomPosition(),
    id: 'fikret-npc'
};

// Oyuncu skorlarını saklamak için yapı
const playerScores = new Map(); // {id: {name: string, score: number}}

io.on('connection', (socket) => {
    console.log('Oyuncu bağlandı:', socket.id);
    
    // Dünya nesnelerini bağlanan oyuncuya gönder
    socket.emit('worldObjects', WORLD_OBJECTS);

    socket.on('playerJoin', (data) => {
        const { playerName, playerId } = data;
        // Mevcut skoru kontrol et veya yeni skor oluştur
        const existingScore = playerScores.get(playerId) || { name: playerName, score: 0 };
        
        // Yeni oyuncuyu sabit spawn noktasında oluştur
        players.set(socket.id, {
            id: socket.id,
            playerId: playerId, // Kalıcı ID'yi ekle
            name: playerName,
            position: { ...SPAWN_POINT },
            rotation: { y: 0 },
            health: 100,
            lastDamageTime: 0,
            score: existingScore.score // Mevcut skoru kullan
        });

        // Skor tablosunu güncelle
        playerScores.set(playerId, {
            name: playerName,
            score: existingScore.score
        });

        // Mevcut oyuncuları yeni oyuncuya gönder
        socket.emit('currentPlayers', Array.from(players.values()));
        
        // Fikret NPC'sinin pozisyonunu gönder
        socket.emit('fikretPosition', fikretNPC);
        
        // En yüksek skorları gönder
        const topScores = Array.from(playerScores.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                score: data.score
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        
        io.emit('topScores', topScores);
        
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

    // Fikret'e teklif yapma
    socket.on('offerToFikret', () => {
        const player = players.get(socket.id);
        if (player) {
            // Oyuncunun puanını artır
            player.score = (player.score || 0) + 1;
            
            // Kalıcı skorları güncelle
            const playerData = playerScores.get(player.playerId);
            if (playerData) {
                playerData.score = player.score;
                playerScores.set(player.playerId, playerData);
            }
            
            // Fikret'i yeni konuma taşı
            fikretNPC.position = getRandomPosition();
            
            // En yüksek skorları hesapla
            const topScores = Array.from(playerScores.entries())
                .map(([id, data]) => ({
                    id,
                    name: data.name,
                    score: data.score
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
            
            // Tüm oyunculara güncel pozisyonu, puanı ve en yüksek skorları bildir
            io.emit('fikretMoved', fikretNPC);
            io.emit('scoreUpdated', {
                playerId: socket.id,
                score: player.score
            });
            io.emit('topScores', topScores);
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