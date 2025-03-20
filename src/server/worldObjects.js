const WORLD_OBJECTS = {
    trees: [
        // Orman bölgesi 1
        ...Array(20).fill().map(() => ({
            x: -100 + Math.random() * 50,
            z: -100 + Math.random() * 50
        })),
        // Orman bölgesi 2
        ...Array(20).fill().map(() => ({
            x: 50 + Math.random() * 50,
            z: 50 + Math.random() * 50
        })),
        // Dağınık ağaçlar
        ...Array(40).fill().map(() => ({
            x: -150 + Math.random() * 300,
            z: -150 + Math.random() * 300
        }))
    ],
    rocks: [
        // Kayalık bölge 1
        ...Array(15).fill().map(() => ({
            x: -80 + Math.random() * 40,
            z: 60 + Math.random() * 40,
            scale: 0.5 + Math.random() * 2
        })),
        // Kayalık bölge 2
        ...Array(15).fill().map(() => ({
            x: 40 + Math.random() * 40,
            z: -80 + Math.random() * 40,
            scale: 0.5 + Math.random() * 2
        })),
        // Dağınık kayalar
        ...Array(30).fill().map(() => ({
            x: -150 + Math.random() * 300,
            z: -150 + Math.random() * 300,
            scale: 0.5 + Math.random() * 1.5
        }))
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

module.exports = WORLD_OBJECTS;