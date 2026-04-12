import {
  SaveFreelanceDetails,
  getFreelanceDetails,
} from "../../lib/freelancer";

const personalDetails = (set) => ({
  freelanceDetails: {},
  personalDetailLoading: false,
  error: null,
  fetched: false,

  SavePersonalDetails: async (data) => {
    set({ personalDetailLoading: true, error: null });

    try {
      const res = await SaveFreelanceDetails(data);

      set({
        freelanceDetails: res.data,
        personalDetailLoading: false,
      });

      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Save personal data failed",
        personalDetailLoading: false,
      });
      throw err;
    }
  },
  getPersonalDetails: async () => {
    set({ personalDetailLoading: true, error: null });
    try {
      const res = await getFreelanceDetails();
      set({
        freelanceDetails: res.data,
        personalDetailLoading: false,
        fetched: true,
      });
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message ||
          err.message ||
          "Fetch personal data failed",
        personalDetailLoading: false,
      });
      throw err;
    }
  },
});

export default personalDetails;
