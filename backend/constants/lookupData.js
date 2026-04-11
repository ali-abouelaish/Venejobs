const crypto = require("crypto");

function generateStableId(name) {
  return crypto.createHash("md5").update(name).digest("hex").slice(0, 8);
}

const categories = [
  { code: "it_programming", name: "IT & Programming" },
  { code: "design_multimedia", name: "Design & Multimedia" },
  { code: "marketing", name: "Marketing" },
  { code: "admin_support", name: "Admin Support" },
  { code: "writing_translation", name: "Writing & Translation" }
];

const rawSkills = {
  it_programming: [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "PHP",
    "TypeScript",
    "SQL"
  ],

  design_multimedia: [
    "UI Design",
    "UX Design",
    "Wireframing",
    "Figma",
    "Prototyping"
  ],

  marketing: ["SEO", "Google Ads", "Content Marketing"],

  admin_support: ["Data Entry", "Customer Support"],

  writing_translation: ["Copywriting", "Translation"]
};



const skillsByCategory = {};

Object.keys(rawSkills).forEach((category) => {
  skillsByCategory[category] = rawSkills[category].map((skillName) => ({
    id: generateStableId(skillName),
    name: skillName
  }));
});

module.exports = {
  categories,
  skillsByCategory
};