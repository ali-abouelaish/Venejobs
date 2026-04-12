import { create } from "zustand";
import { toast, Slide } from "react-toastify";
import CustomToast from "../components/Utility/CustomToast";

const BASE_TOAST_OPTIONS = {
  position: "bottom-right",
  autoClose: 1200,
  hideProgressBar: true,
  closeButton: false,
  pauseOnHover: true,
  closeOnClick: true,
  draggable: false,
  transition: Slide,
  icon: false,
  // Style overrides
  className: "!bg-transparent !shadow-none !p-0 !m-0",
  bodyClassName: "!p-0 !m-0 flex",
  progressStyle: { display: "none" },
};

const useToastStore = create(() => ({
  showSuccess: (title = "Success", msg = "Success toast message") => {
    toast(<CustomToast title={title} message={msg} type="success" />, {
      ...BASE_TOAST_OPTIONS,
      type: "success",
    });
  },

  showError: (title = "Error", msg = "Something went wrong") => {
    toast(<CustomToast title={title} message={msg} type="error" />, {
      ...BASE_TOAST_OPTIONS,
      type: "error",
    });
  },

  showWarning: (title = "Warning", msg = "Warning message") => {
    toast(<CustomToast title={title} message={msg} type="warning" />, {
      ...BASE_TOAST_OPTIONS,
      type: "warning",
    });
  },

  showInfo: (title = "Info", msg = "Informational message") => {
    toast(<CustomToast title={title} message={msg} type="info" />, {
      ...BASE_TOAST_OPTIONS,
      type: "info",
    });
  },
}));

export default useToastStore;
