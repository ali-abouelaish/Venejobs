import React, { useEffect, useState } from "react";
import Button from "@/app/components/button/Button";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import InputField from "@/app/components/common/InputField";

const INITIAL_PORTFOLIO = {
  title: "",
  project_url: "",
};

const validatePortfolio = (data) => {
  const errors = {};

  if (!data.title.trim()) {
    errors.title = "Project title is required";
  } else if (data.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters";
  }

  if (!data.project_url.trim()) {
    errors.project_url = "Project URL is required";
  } else {
    try {
      const url = new URL(data.project_url);

      if (!["http:", "https:"].includes(url.protocol)) {
        errors.project_url = "URL must start with http:// or https://";
      } else if (url.hostname.endsWith(".")) {
        errors.project_url = "Domain name cannot end with a dot";
      } else if (!url.hostname.includes(".")) {
        errors.project_url = "Enter a valid domain name";
      }
    } catch {
      errors.project_url = "Enter a valid full URL (https://example.com)";
    }
  }

  return errors;
};

const PortfolioModal = ({
  setshowForm,
  append,
  update,
  editIndex,
  fields,
}) => {
  const [portfolio, setPortfolio] = useState(INITIAL_PORTFOLIO);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setPortfolio(editIndex !== null ? fields[editIndex] : INITIAL_PORTFOLIO);
  }, [editIndex, fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPortfolio((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = () => {

    const validationErrors = validatePortfolio(portfolio);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    editIndex !== null
      ? update(editIndex, portfolio)
      : append(portfolio);

    setshowForm(false);
  };


  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className="
          bg-white
          w-full h-full
          rounded-none
          overflow-y-auto
          flex flex-col
          md:h-auto
          md:max-h-[90vh]
          md:max-w-[800px]
          md:rounded-2xl
          relative
        "
      >
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6 flex-1">


          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              {editIndex !== null ? "Edit Portfolio" : "Add Portfolio"}
            </h2>
            <button onClick={() => setshowForm(false)} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Project Title"
              name="title"
              value={portfolio.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="E-commerce Website"
            />

            <InputField
              label="Project URL"
              name="project_url"
              value={portfolio.project_url}
              onChange={handleChange}
              error={errors.project_url}
              placeholder="https://example.com"
            />
          </div>

        </div>

        <div className="sticky bottom-0 bg-white px-4 py-4 md:px-6 flex justify-end gap-4">
          <Button
            onClick={() => setshowForm(false)}
            variant="lightCard"
            className="w-full"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="secondaryFilled"
            className="w-full"
            type="button"
          >
            Save
          </Button>

        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;
