import {
  getFreelancerExperience,
  addFreelancerExperience,
  updateFreelancerExperience,
  deleteFreelancerExperience,
} from "../../lib/freelancer";

const freelancerExperience = (set) => ({
  freelancerExperience: [{}],
  freelancerExperienceLoading: false,
  error: null,
  fetched: false,

  getExperience: async () => {
    set({ freelancerExperienceLoading: true, error: null });
    try {
      const res = await getFreelancerExperience();
      set({
        freelancerExperience: res.data,
        freelancerExperienceLoading: false,
      });
    } catch (err) {
      set({ error: err.message, freelancerExperienceLoading: false });
    }
  },
  addExperience: async (data) => {
    set({ freelancerExperienceLoading: true, error: null });
    try {
      const res = await addFreelancerExperience(data);
      set((state) => ({
        freelancerExperience: [...state.freelancerExperience, res.data],
        freelancerExperienceLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Add experience failed",
        freelancerExperienceLoading: false,
      });
      throw err;
    }
  },
  updateExperience: async (id, data) => {
    set({ freelancerExperienceLoading: true, error: null });
    try {
      const res = await updateFreelancerExperience(id, data);
      const updatedExperience = res.data;
      set((state) => ({
        freelancerExperience: state.freelancerExperience.map((experience) =>
          experience.id === id ? updatedExperience : experience
        ),
        freelancerExperienceLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Update experiences failed",
        freelancerExperienceLoading: false,
      });
      throw err;
    }
  },
  deleteExperience: async (id) => {
    set({ freelancerExperienceLoading: true, error: null });
    try {
      const res = await deleteFreelancerExperience(id);
      set((state) => ({
        freelancerExperience: state.freelancerExperience.filter(
          (experience) => experience.id !== id
        ),
        freelancerExperienceLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Delete Experience failed",
        freelancerExperienceLoading: false,
      });
      throw err;
    }
  },
});

export default freelancerExperience;
