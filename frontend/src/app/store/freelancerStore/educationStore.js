import {
  getFreelancerEducation,
  addFreelancerEducation,
  updateFreelancerEducation,
  deleteFreelancerEducation,
} from "../../lib/freelancer";

const freelancerEducation = (set) => ({
  freelancerEducation: [{}],
  freelancerEducationLoading: false,
  error: null,
  fetched: false,

  getEducation: async () => {
    set({ freelancerEducationLoading: true, error: null });
    try {
      const res = await getFreelancerEducation();
      set({
        freelancerEducation: res.data,
        freelancerEducationLoading: false,
      });
    } catch (err) {
      set({ error: err.message, freelancerEducationLoading: false });
    }
  },
  addEducation: async (data) => {
    set({ freelancerEducationLoading: true, error: null });
    try {
      const res = await addFreelancerEducation(data);
      set((state) => ({
        freelancerEducation: [...state.freelancerEducation, res.data],
        freelancerEducationLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message || err.message || "Add education failed",
        freelancerEducationLoading: false,
      });
      throw err;
    }
  },
  updateEducation: async (id, data) => {
    set({ freelancerEducationLoading: true, error: null });
    try {
      const res = await updateFreelancerEducation(id, data);
      const updatedEducation = res.data;
      set((state) => ({
        freelancerEducation: state.freelancerEducation.map((education) =>
          education.id === id ? updatedEducation : education
        ),
        freelancerEducationLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.id?.message ||
          err.message ||
          "Update education failed",
        freelancerEducationLoading: false,
      });
      throw err;
    }
  },
  deleteEducation: async (id) => {
    set({ freelancerEducationLoading: true, error: null });
    try {
      const res = await deleteFreelancerEducation(id);
      set((state) => ({
        freelancerEducation: state.freelancerEducation.filter(
          (education) => education.id !== id
        ),
        freelancerEducationLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Delete education failed",
        freelancerEducationLoading: false,
      });
      throw err;
    }
  },
});

export default freelancerEducation;
