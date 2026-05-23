// Mock data shaped to match the production endpoints in SERVICES_HANDOFF.md.
// All money is integer pence.

const NOW = Date.now();
const day = 86400000;

const ME = {
  freelancer: { id: 12, name: "Alishan Noor", email: "alishan@example.com", avatar: null },
  client:     { id: 31, name: "Maya Chen",     email: "maya@example.com",   avatar: null },
  admin:      { id:  1, name: "Admin",         email: "admin@venejobs.io",  avatar: null },
};

const PEOPLE = {
  12: { id: 12, name: "Alishan Noor",    role: "freelancer", avatar: null, rating: 4.9, reviews: 132, country: "Pakistan" },
  31: { id: 31, name: "Maya Chen",       role: "client",     avatar: null, country: "United States" },
  18: { id: 18, name: "Priya Bansal",    role: "freelancer", avatar: null, rating: 4.8, reviews: 71,  country: "India" },
  22: { id: 22, name: "Daniel Ortega",   role: "freelancer", avatar: null, rating: 4.7, reviews: 41,  country: "Mexico" },
  44: { id: 44, name: "Sara Lindqvist",  role: "freelancer", avatar: null, rating: 5.0, reviews: 208, country: "Sweden" },
  56: { id: 56, name: "Theo Nakamura",   role: "freelancer", avatar: null, rating: 4.6, reviews: 18,  country: "Japan" },
  77: { id: 77, name: "Jordan Pierce",   role: "client",     avatar: null, country: "Canada" },
};

const CATEGORIES = [
  "Design & Creative", "Programming & Tech", "Writing & Translation",
  "Video & Animation", "Marketing", "Business",
];

const SERVICES = [
  {
    id: "svc_01",
    freelancerId: 12,
    title: "I will design a modern, conversion-focused landing page",
    description: "Hand-crafted Figma design tailored to your brand and goals. Mobile first, responsive at three breakpoints. Includes one round of revisions.",
    category: "Design & Creative",
    basePrice: 18500,                // $185.00
    deliveryDays: 5,
    revisionsIncluded: 1,
    status: "published",
    rating: 4.9,
    reviews: 78,
    cover: "#01237C",
    addons: [
      { id: "a1", type: "revision",        name: "Extra revision round",     description: "One additional round of feedback", price: 2500, allowMulti: true },
      { id: "a2", type: "extra",           name: "Additional page",          description: "Add one more page in the same style", price: 9000, allowMulti: true },
      { id: "a3", type: "faster_delivery", name: "48-hour delivery",         description: "Priority queue and direct review",   price: 6000, deliveryDelta: -3 },
      { id: "a4", type: "extra",           name: "Source files (Figma)",     description: "Editable .fig with components",       price: 3500 },
    ],
  },
  {
    id: "svc_02",
    freelancerId: 18,
    title: "I will write SEO-optimized blog articles in your brand voice",
    description: "Original 1500+ word blog post with primary keyword research, headings, and a meta description. Researched, sourced, and ready to publish.",
    category: "Writing & Translation",
    basePrice: 7500,
    deliveryDays: 3,
    revisionsIncluded: 2,
    status: "published", rating: 4.8, reviews: 41,
    cover: "#7a5a3a",
    addons: [
      { id: "b1", type: "revision",        name: "Extra revision",       price: 1500, allowMulti: true },
      { id: "b2", type: "extra",           name: "Add 500 more words",   price: 2500, allowMulti: true },
      { id: "b3", type: "faster_delivery", name: "24-hour delivery",     price: 3500 },
    ],
  },
  {
    id: "svc_03",
    freelancerId: 22,
    title: "I will edit your podcast episode with intro, music, and chapters",
    description: "Up to 60 minutes of audio. Noise reduction, leveling, intro and outro stings, music bed, and chapter markers.",
    category: "Video & Animation",
    basePrice: 12500,
    deliveryDays: 4,
    revisionsIncluded: 1,
    status: "published", rating: 4.7, reviews: 24,
    cover: "#1A463A",
    addons: [
      { id: "c1", type: "extra",           name: "Add show notes & timestamps", price: 4500 },
      { id: "c2", type: "faster_delivery", name: "48-hour delivery",            price: 5500 },
    ],
  },
  {
    id: "svc_04",
    freelancerId: 44,
    title: "I will build a custom Shopify section with metafield support",
    description: "Production-ready Shopify Online Store 2.0 section. Schema, presets, and Liquid logic. Compatible with Dawn-based themes.",
    category: "Programming & Tech",
    basePrice: 22000,
    deliveryDays: 6,
    revisionsIncluded: 2,
    status: "published", rating: 5.0, reviews: 53,
    cover: "#444",
    addons: [
      { id: "d1", type: "extra",    name: "Second section variation", price: 12000 },
      { id: "d2", type: "revision", name: "Extra revision round",     price: 3500, allowMulti: true },
    ],
  },
  {
    id: "svc_05",
    freelancerId: 56,
    title: "I will create a 30-second motion graphic explainer",
    description: "Storyboard, illustration, animation, and final delivery as 1080p MP4 with optional subtitle file.",
    category: "Video & Animation",
    basePrice: 35000,
    deliveryDays: 10,
    revisionsIncluded: 2,
    status: "pending_review", rating: 4.6, reviews: 12,
    cover: "#9a5b3a",
    addons: [],
    submittedAt: NOW - day * 2,
  },
  {
    id: "svc_draft_01",
    freelancerId: 12,
    title: "I will set up Stripe Connect for your marketplace",
    description: "",
    category: "Programming & Tech",
    basePrice: 0, deliveryDays: 7, revisionsIncluded: 1,
    status: "draft",
    addons: [],
  },
  {
    id: "svc_rejected_01",
    freelancerId: 12,
    title: "I will optimize your homepage copy",
    description: "Persuasive, on-brand copy that converts.",
    category: "Writing & Translation",
    basePrice: 9500, deliveryDays: 4, revisionsIncluded: 1,
    status: "rejected", rejectionReason: "Title and description need to reference at least one deliverable format. Mention 'long-form copy' or word count.",
    rejectedAt: NOW - day * 4,
    addons: [],
  },
];

const ORDERS = [
  {
    id: "ord_a1",
    serviceId: "svc_01",
    freelancerId: 12, clientId: 31,
    state: "delivered",
    baseAmount: 18500,
    addonsAmount: 2500, // one extra revision
    totalAmount: 21000,
    platformFeePence: 2100,
    revisionsPurchased: 1, revisionsUsed: 0,
    deliveryDeadline: NOW + day * 1,
    autoAcceptDeadline: NOW + day * 3,
    paidAt: NOW - day * 6,
    deliveredAt: NOW - day * 1,
    deliveries: [{ id: "del_1", message: "Delivery 1 is ready. Figma file attached with all three breakpoints and a Loom walkthrough.", deliveredAt: NOW - day * 1, attachments: [
      { id: "f1", filename: "Vivid Acres - LP Final.fig", size: 4_300_000, mime: "application/octet-stream" },
      { id: "f2", filename: "Walkthrough.mp4",            size: 28_400_000, mime: "video/mp4" },
    ]}],
    revisions: [], disputes: [],
    addons: [{ id: "a1", addonId: "a1", name: "Extra revision round", type: "revision", price: 2500, quantity: 1 }],
  },
  {
    id: "ord_a2",
    serviceId: "svc_03",
    freelancerId: 22, clientId: 31,
    state: "in_progress",
    baseAmount: 12500, addonsAmount: 5500, totalAmount: 18000, platformFeePence: 1800,
    revisionsPurchased: 0, revisionsUsed: 0,
    deliveryDeadline: NOW + day * 3,
    paidAt: NOW - day * 1,
    deliveries: [], revisions: [], disputes: [],
    addons: [{ id: "c2", addonId: "c2", name: "48-hour delivery", type: "faster_delivery", price: 5500, quantity: 1 }],
  },
  {
    id: "ord_a3",
    serviceId: "svc_04",
    freelancerId: 44, clientId: 31,
    state: "paid",
    baseAmount: 22000, addonsAmount: 0, totalAmount: 22000, platformFeePence: 2200,
    revisionsPurchased: 0, revisionsUsed: 0,
    deliveryDeadline: NOW + day * 6,
    paidAt: NOW - 60 * 60 * 1000,
    deliveries: [], revisions: [], disputes: [],
    addons: [],
  },
  {
    id: "ord_a4",
    serviceId: "svc_02",
    freelancerId: 18, clientId: 31,
    state: "completed",
    baseAmount: 7500, addonsAmount: 0, totalAmount: 7500, platformFeePence: 750,
    revisionsPurchased: 0, revisionsUsed: 0,
    deliveryDeadline: NOW - day * 10, deliveredAt: NOW - day * 9, acceptedAt: NOW - day * 8,
    transferId: "tr_test_12345",
    deliveries: [{ id: "del_2", message: "Article delivered. Word count: 1623. Sources at the bottom of the doc.", deliveredAt: NOW - day * 9, attachments: [{ id: "f3", filename: "stripe-connect-explained.docx", size: 142_300, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }] }],
    revisions: [], disputes: [],
    addons: [],
  },
  {
    id: "ord_a5",
    serviceId: "svc_01",
    freelancerId: 12, clientId: 77,
    state: "revision_requested",
    baseAmount: 18500, addonsAmount: 0, totalAmount: 18500, platformFeePence: 1850,
    revisionsPurchased: 0, revisionsUsed: 1,
    deliveryDeadline: NOW + day * 2,
    paidAt: NOW - day * 5, deliveredAt: NOW - day * 2,
    deliveries: [{ id: "del_3", message: "First pass attached. Used the brand colors from the doc and added a CTA bar.", deliveredAt: NOW - day * 2, attachments: [] }],
    revisions: [{ id: "rv_1", message: "Can the hero be more energetic? The headline feels safe. Try a stronger verb and consider a darker accent for contrast.", requestedAt: NOW - day * 1 }],
    disputes: [],
    addons: [],
  },
  {
    id: "ord_a6",
    serviceId: "svc_03",
    freelancerId: 22, clientId: 77,
    state: "disputed",
    baseAmount: 12500, addonsAmount: 0, totalAmount: 12500, platformFeePence: 1250,
    revisionsPurchased: 0, revisionsUsed: 0,
    deliveryDeadline: NOW - day * 1, deliveredAt: NOW - day * 1,
    deliveries: [{ id: "del_4", message: "Final edit attached. Two music options provided.", deliveredAt: NOW - day * 1, attachments: [] }],
    revisions: [],
    disputes: [{ id: "dp_1", reason: "Audio levels are inconsistent across chapters and the intro music drowns out the host's voice for the first 12 seconds. Asked for chapters but only one delivered.", raisedAt: NOW - day * 0.5, raisedBy: 77 }],
    addons: [],
  },
  {
    id: "ord_a7",
    serviceId: "svc_04",
    freelancerId: 44, clientId: 77,
    state: "cancelled",
    baseAmount: 22000, addonsAmount: 0, totalAmount: 22000, platformFeePence: 2200,
    revisionsPurchased: 0, revisionsUsed: 0,
    deliveryDeadline: NOW - day * 3, paidAt: NOW - day * 12,
    deliveries: [], revisions: [], disputes: [],
    addons: [],
    cancelledAt: NOW - day * 1,
  },
];

// Helper lookups
function getService(id)  { return SERVICES.find(s => s.id === id); }
function getOrder(id)    { return ORDERS.find(o => o.id === id); }
function getPerson(id)   { return PEOPLE[id] || PEOPLE[12]; }
function ordersForFreelancer(id) { return ORDERS.filter(o => o.freelancerId === id); }
function ordersForClient(id)     { return ORDERS.filter(o => o.clientId === id); }
function servicesForFreelancer(id) { return SERVICES.filter(s => s.freelancerId === id); }
function pendingReviewServices()   { return SERVICES.filter(s => s.status === "pending_review"); }
function openDisputes()            { return ORDERS.filter(o => o.state === "disputed"); }

Object.assign(window, {
  ME, PEOPLE, CATEGORIES, SERVICES, ORDERS,
  getService, getOrder, getPerson,
  ordersForFreelancer, ordersForClient, servicesForFreelancer,
  pendingReviewServices, openDisputes,
});
