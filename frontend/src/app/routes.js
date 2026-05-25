export const Routes = {
  home: "/",
  messages: "/messages",

  services: {
    browse: "/services",
    detail: (id) => `/services/${id}`,
  },

  orders: {
    detail: (id) => `/orders/${id}`,
    buyRevisions: (id) => `/orders/${id}/buy-revisions`,
  },

  client: {
    home: "/client",
    chat: "/client/chat/",
    hirePayment: "/client/HirePayment/",
    orders: "/client/orders",

    job_post: {
      home: "/client/jobpost/",
      form: "/client/jobpost/forms/",
    },

    profile: {
      home: "/profile/client",
      info: "/profile/client/Info",
      bill: "/profile/client/Bill",
    },
  },

  freelancer: {
    home: "/freelancer",
    get_started: "/freelancer/profile/edit",
    edit_profile: "/freelancer/profile/edit",
    page: "/freelancer/home",
    chat: "/freelancer/chat/",
    jobdetail: "/freelancer/JobDetail/",
    profileData: "/freelancer/profileData",
    onboarding: "/freelancer/onboarding",
    finances: "/freelancer/finances",
    services: "/freelancer/services",
    newService: "/freelancer/services/new",
    orders: "/freelancer/orders",

    profile: {
      home: "/profile/freelancer",
      info: "/profile/freelancer/Info",
      billing: "/profile/freelancer/BillingPage",
    },

    service: {
      home: "/freelancer/AddService/",
      form: "/freelancer/AddService/form",
    },
  },

  admin: {
    home: "/admin/services",
    services: "/admin/services",
    disputes: "/admin/disputes",
  },

  auth: {
    signin: "/auth/signin/",
    signup: "/auth/signup/",
    forgotPassword: "/auth/forgot-password",
  },
};
