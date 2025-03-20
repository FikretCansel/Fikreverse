const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

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

// Sabit dünya nesneleri
const WORLD_OBJECTS = {
    trees: [
        { x: -80, z: -80 },
        { x: 60, z: 70 },
        { x: -40, z: 90 },
        // ...daha fazla ağaç koordinatı
    ],
    rocks: [
        { x: -20, z: -30 },
        { x: 45, z: -60 },
        { x: -70, z: 40 },
        // ...daha fazla kaya koordinatı
    ],
    cvPoints: [
        {
            position: { x: 0, z: 20 },
            title: "İş Deneyimi - Featuremind",
            content: "Frontend Engineer (Aug 2023 - Feb 2025)\n• B2C e-commerce platformu geliştirme\n• Next.js, TypeScript kullanımı\n• CMS, Dynamic Yield, Algolia entegrasyonları"
        },
        {
            position: { x: 20, z: 20 },
            title: "İş Deneyimi - Jotform",
            content: "Frontend Engineer (Sep 2022 – Jun 2023)\n• Yeni uygulama geliştirme\n• Teknik sorunları çözme\n• JavaScript, React.js, Redux kullanımı"
        },
        {
            position: { x: -20, z: 20 },
            title: "Eğitim",
            content: "Pamukkale Üniversitesi\nBilgisayar Mühendisliği\nOrtalama: 3.26/4"
        },
        {
            position: { x: 0, z: -20 },
            title: "Projeler",
            content: "• Jetweb - Hızlı web sitesi yayınlama platformu\n• Rent A Car App - Araç kiralama sistemi\n• Unisome - Üniversite sosyal medya uygulaması\n• PCDrop - Dosya transfer uygulaması"
        },
        {
            position: { x: 20, z: -20 },
            title: "Yetenekler",
            content: "• Next.js, React.js\n• HTML/CSS/JavaScript/TypeScript\n• Node.js, Express.js\n• React Native\n• Redux, Saga, Toolkit"
        },
        {
            position: { x: -20, z: -20 },
            title: "İletişim",
            content: "Email: Fikretcansel25@gmail.com\nTelefon: +90 551 061 69 16\nGithub: github.com/FikretCansel\nWebsite: softfes.vercel.app/fikretcansel"
        }
    ]
};

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
            health: 100
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