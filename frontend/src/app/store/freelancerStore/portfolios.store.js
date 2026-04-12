import {
  getFreelancerPortfolio,
  addFreelancerPortfolio,
  updateFreelancerPortfolio,
  deleteFreelancerPortfolio,
} from "../../lib/freelancer";

const freelancerPortfolio = (set) => ({
  freelancePortfolio: [],
  freelancerPortfolioLoading: false,
  error: null,
  fetched: false,

  getPortfolio: async () => {
    set({ freelancerPortfolioLoading: true, error: null });
    try {
      const res = await getFreelancerPortfolio();
      set({
        freelancePortfolio: res.data,
        freelancerPortfolioLoading: false,
      });
    } catch (err) {
      set({ error: err.message, freelancerPortfolioLoading: false });
    }
  },
  addPortfolio: async (data) => {
    set({ freelancerPortfolioLoading: true, error: null });
    try {
      const res = await addFreelancerPortfolio(data);
      set((state) => ({
        freelancePortfolio: [...state.freelancePortfolio, res.data],
        freelancerPortfolioLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message || err.message || "Add portfolio failed",
        freelancerPortfolioLoading: false,
      });
      throw err;
    }
  },
  updatePortfolio: async (id, data) => {
    set({ freelancerPortfolioLoading: true, error: null });
    try {
      const res = await updateFreelancerPortfolio(id, data);
      const updatedPortfolio = res.data;
      set((state) => ({
        freelancePortfolio: state.freelancePortfolio.map((portfolio) =>
          portfolio.id === id ? updatedPortfolio : portfolio
        ),
        freelancerPortfolioLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.id?.message ||
          err.message ||
          "Update portfolio failed",
        freelancerPortfolioLoading: false,
      });
      throw err;
    }
  },
  deletePortfolio: async (id) => {
    set({ freelancerPortfolioLoading: true, error: null });
    try {
      const res = await deleteFreelancerPortfolio(id);
      set((state) => ({
        freelancePortfolio: state.freelancePortfolio.filter(
          (portfolio) => portfolio.id !== id
        ),
        freelancerPortfolioLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Delete portfolio failed",
        freelancerPortfolioLoading: false,
      });
      throw err;
    }
  },
});

export default freelancerPortfolio;
