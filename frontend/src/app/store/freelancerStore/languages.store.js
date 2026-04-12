import {
  getFreelancerLanguage,
  addFreelanceLanguage,
  updateFreelanceLanguage,
  deleteFreelanceLanguage,
} from "../../lib/freelancer";

const freelancerLanguage = (set) => ({
  freelancerLanguage: [{}],
  freelancerLanguageLoading: false,
  error: null,
  fetched: false,

  getLanguage: async () => {
    set({ freelancerLanguageLoading: true, error: null });
    try {
      const res = await getFreelancerLanguage();
      set({
        freelancerLanguage: res.data,
        freelancerLanguageLoading: false,
      });
    } catch (err) {
      set({ error: err.message, freelancerLanguageLoading: false });
    }
  },
  addLanguage: async (data) => {
    set({ freelancerLanguageLoading: true, error: null });
    try {
      const res = await addFreelanceLanguage(data);
      set((state) => ({
        freelancerLanguage: [...state.freelancerLanguage, res.data],
        freelancerLanguageLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message || err.message || "Add language failed",
        freelancerLanguageLoading: false,
      });
      throw err;
    }
  },
  updateLanguage: async (id, data) => {
    set({ freelancerLanguageLoading: true, error: null });
    try {
      const res = await updateFreelanceLanguage(id, data);
      const updatedLanguage = res.data;
      set((state) => ({
        freelancerLanguage: state.freelancerLanguage.map((language) =>
          language.id === id ? updatedLanguage : language
        ),
        freelancerLanguageLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.id?.message || err.message || "Update language failed",
        freelancerLanguageLoading: false,
      });
      throw err;
    }
  },
  deleteLanguage: async (id) => {
    set({ freelancerLanguageLoading: true, error: null });
    try {
      const res = await deleteFreelanceLanguage(id);
      set((state) => ({
        freelancerLanguage: state.freelancerLanguage.filter(
          (language) => language.id !== id
        ),
        freelancerLanguageLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Delete language failed",
        freelancerLanguageLoading: false,
      });
      throw err;
    }
  },
});

export default freelancerLanguage;
