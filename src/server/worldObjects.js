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
            title: "Work Experience - Featuremind",
            content: "Frontend Engineer (Aug 2023 - Feb 2025)\n• Developed a B2C e-commerce platform\n• Used Next.js and TypeScript\n• Integrated CMS, Dynamic Yield, and Algolia"
        },
        {
            position: { x: 50, z: 80 },
            title: "Work Experience - Jotform",
            content: "Frontend Engineer (Sep 2022 – Jun 2023)\n• Developed a new application\n• Solved technical issues\n• Used JavaScript, React.js, and Redux"
        },
        {
            position: { x: -20, z: 20 },
            title: "Education",
            content: "Pamukkale University\nComputer Engineering\nGPA: 3.26/4"
        },
        {
            position: { x: 10, z: -40 },
            title: "Projects",
            content: "• Jetweb - Instant website publishing platform\n• Rent A Car App - Car rental system\n• Unisome - University social media app\n• PCDrop - File transfer application"
        },
        {
            position: { x: 20, z: -20 },
            title: "Skills",
            content: "• Next.js, React.js\n• HTML/CSS/JavaScript/TypeScript\n• Node.js, Express.js\n• React Native\n• Redux, Saga, Toolkit"
        },
        {
            position: { x: -20, z: -20 },
            title: "Contact",
            content: "Email: Fikretcansel25@gmail.com\nGithub: github.com/FikretCansel\nWebsite: softfes.vercel.app/fikretcansel"
        }
    ]    
};

module.exports = WORLD_OBJECTS;