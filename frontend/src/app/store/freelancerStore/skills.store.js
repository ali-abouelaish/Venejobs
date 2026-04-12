import {
  getAllSkills,
  addfreelancerSkills,
  updatefreelancerSkills,
  deleteFreelanceSkill,
  getFreelancerSkills,
} from "../../lib/freelancer";

const freelancerSkills = (set) => ({
  freelancerSkills: [],
  freelancerSkillLoading: false,
  error: null,
  fetched: false,

  getSkills: async () => {
    set({ freelancerSkillLoading: true, error: null });
    try {
      const res = await getFreelancerSkills();
      set({
        freelancerSkills: res.data,
        freelancerSkillLoading: false,
      });
    } catch (err) {
      set({ error: err.message, freelancerSkillLoading: false });
    }
  },
  addSkill: async (data) => {
    set({ freelancerSkillLoading: true, error: null });
    try {
      const res = await addfreelancerSkills(data);
      set((state) => ({
        freelancerSkills: [...state.freelancerSkills, res.data],
        freelancerSkillLoading: false,
      }));
      return res;
    } catch (err) {
      set({ error: err.message, freelancerSkillLoading: false });
    }
  },
  updateSkills: async (id, data) => {
    set({ freelancerSkillLoading: true, error: null });

    try {
      const res = await updatefreelancerSkills(id, data);
      const updatedSkill = res.data;
      set((state) => ({
        freelancerSkills: state.freelancerSkills.map((skill) =>
          skill.id === id ? updatedSkill : skill
        ),
        freelancerSkillLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message || err.message || "Update skills failed",
        freelancerSkillLoading: false,
      });
      throw err;
    }
  },
  deleteSkill: async (id) => {
    set({ freelancerSkillLoading: true, error: null });

    try {
      const res = await deleteFreelanceSkill(id);
      set((state) => ({
        freelancerSkills: state.freelancerSkills.filter(
          (skill) => skill.id !== id
        ),
        freelancerSkillLoading: false,
      }));
      return res;
    } catch (err) {
      set({
        error:
          err?.response?.data?.message || err.message || "Delete Skill failed",
        freelancerSkillLoading: false,
      });
      throw err;
    }
  },
  allSkills: async () => {
    set({ freelancerSkillLoading: true, error: null });
    try {
      const res = await getAllSkills();
      set({
        skills: res.data,
        freelancerSkillLoading: false,
      });
    } catch (err) {
      set({ error: err.message, freelancerSkillLoading: false });
    }
  },
});

export default freelancerSkills;
