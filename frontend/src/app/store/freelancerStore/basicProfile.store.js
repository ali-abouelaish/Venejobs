import {
  updateFreelanceBasicprofile,
  getFreelanceBasicprofile,
} from "../../lib/freelancer";

const freelancerBasicProfile = (set) => ({
  freelanceBasicprofile: [],
  basicProfileLoading: false,
  error: null,
  fetched: false,

  getBasicprofile: async () => {
    set({ basicProfileLoading: true, error: null });
    try {
      const res = await getFreelanceBasicprofile();
      set({
        freelanceBasicprofile: res.data,
        basicProfileLoading: false,
        fetched: true,
      });
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Fetch Freelance Basic profile failed",
        basicProfileLoading: false,
      });
      throw err;
    }
  },
  updatePersonalDetails: async (data) => {
    set({ basicProfileLoading: true, error: null });
    try {
      const res = await updateFreelanceBasicprofile(data);
      set({
        freelanceBasicprofile: res.data,
        basicProfileLoading: false,
      });
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Update personal data failed",
        basicProfileLoading: false,
      });
      throw err;
    }
  },
});

export default freelancerBasicProfile;
