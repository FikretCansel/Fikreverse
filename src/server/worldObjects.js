const WORLD_OBJECTS = {
    trees: [
        // Orman bölgesi 1 (Sol üst köşe)
        { x: -100, z: -100 },
        { x: -90, z: -100 },
        { x: -80, z: -100 },
        { x: -100, z: -90 },
        { x: -90, z: -90 },
        { x: -80, z: -90 },
        { x: -100, z: -80 },
        { x: -90, z: -80 },
        { x: -80, z: -80 },

        // Orman bölgesi 2 (Sağ alt köşe)
        { x: 80, z: 80 },
        { x: 90, z: 80 },
        { x: 100, z: 80 },
        { x: 80, z: 90 },
        { x: 90, z: 90 },
        { x: 100, z: 90 },
        { x: 80, z: 100 },
        { x: 90, z: 100 },
        { x: 100, z: 100 },

        // Merkez etrafında ağaçlar
        { x: -20, z: 0 },
        { x: 20, z: 0 },
        { x: 0, z: -20 },
        { x: 0, z: 20 },
    ],
    rocks: [
        // Kayalık bölge 1 (Sol alt)
        { x: -80, z: 60, scale: 2 },
        { x: -70, z: 60, scale: 1.5 },
        { x: -60, z: 60, scale: 1.8 },
        { x: -80, z: 70, scale: 1.6 },
        { x: -70, z: 70, scale: 2 },
        { x: -60, z: 70, scale: 1.7 },

        // Kayalık bölge 2 (Sağ üst)
        { x: 60, z: -80, scale: 2 },
        { x: 70, z: -80, scale: 1.5 },
        { x: 80, z: -80, scale: 1.8 },
        { x: 60, z: -70, scale: 1.6 },
        { x: 70, z: -70, scale: 2 },
        { x: 80, z: -70, scale: 1.7 },

        // Merkez etrafında kayalar
        { x: -30, z: -30, scale: 1 },
        { x: 30, z: 30, scale: 1 },
        { x: -30, z: 30, scale: 1 },
        { x: 30, z: -30, scale: 1 },
    ],
    cvPoints: [
        {
            position: { x: 20, z: 30 },
            title: "İş Deneyimi - Featuremind",
            content: "Frontend Engineer (Aug 2023 - Feb 2025)\n• B2C e-commerce platformu geliştirme\n• Next.js, TypeScript kullanımı\n• CMS, Dynamic Yield, Algolia entegrasyonları"
        },
        {
            position: { x: 50, z: 80 },
            title: "İş Deneyimi - Jotform",
            content: "Frontend Engineer (Sep 2022 – Jun 2023)\n• Yeni uygulama geliştirme\n• Teknik sorunları çözme\n• JavaScript, React.js, Redux kullanımı"
        },
        {
            position: { x: -20, z: 20 },
            title: "Eğitim",
            content: "Pamukkale Üniversitesi\nBilgisayar Mühendisliği\nOrtalama: 3.26/4"
        },
        {
            position: { x: 10, z: -40 },
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

module.exports = WORLD_OBJECTS;