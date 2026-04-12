import React, { useEffect, useState } from "react";
import Button from "@/app/components/button/Button";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import InputField from "@/app/components/common/InputField";

const INITIAL_EXPERIENCE = {
  job_title: "",
  company: "",
  location: "",
  city: "",
  start_month: "",
  start_year: "",
  end_month: "",
  end_year: "",
  description: "",
  is_current: false,
};

const validateExperience = (data) => {
  const errors = {};

  if (!data.job_title) errors.job_title = "Job title is required";
  if (!data.company) errors.company = "Company name is required";
  if (!data.location) errors.location = "Location is required";
  if (!data.city) errors.city = "City is required";
  if (!data.start_month) errors.start_month = "Start month is required";
  if (!data.start_year) errors.start_year = "Start year is required";
  if (!data.description) errors.description = "Description is required";

  if (data.start_month < 1 || data.start_month > 12) {
    errors.start_month = "Month must be between 1 and 12";
  }

  if (!/^\d{4}$/.test(data.start_year)) {
    errors.start_year = "Enter a valid 4 digit year";
  }

  if (!data.is_current) {
    if (!data.end_month) errors.end_month = "End month is required";
    if (!data.end_year) errors.end_year = "End year is required";

    if (data.end_month < 1 || data.end_month > 12) {
      errors.end_month = "Month must be between 1 and 12";
    }

    if (!/^\d{4}$/.test(data.end_year)) {
      errors.end_year = "Enter a valid 4 digit year";
    }

    if (
      data.start_year &&
      data.end_year &&
      Number(data.end_year) < Number(data.start_year)
    ) {
      errors.end_year = "End year cannot be before start year";
    }
  }

  return errors;
};


const validateDateRange = (data) => {
  const errors = {};

  if (
    data.start_year &&
    data.end_year &&
    Number(data.end_year) < Number(data.start_year)
  ) {
    errors.end_year = "End year cannot be before start year";
  }

  return errors;
};


const ExperienceModal = ({ close, append, update, editIndex, fields }) => {
  const [experience, setExperience] = useState(INITIAL_EXPERIENCE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setExperience(editIndex !== null ? fields[editIndex] : INITIAL_EXPERIENCE);
  }, [editIndex, fields]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const numberFields = ["start_month", "end_month", "start_year", "end_year"];
    let finalValue = value;

    // 🔢 number sanitization
    if (numberFields.includes(name)) {
      finalValue = value.replace(/[^0-9]/g, "");

      if (name.includes("month")) {
        if (finalValue.length > 2) return;
        if (finalValue && Number(finalValue) > 12) return;
      }

      if (name.includes("year")) {
        if (finalValue.length > 4) return;
      }
    }

    // ✅ CHECKBOX (fixed)
    if (type === "checkbox" && name === "is_current") {
      setExperience((prev) => {
        const updated = {
          ...prev,
          is_current: checked,
          end_month: checked ? "" : prev.end_month,
          end_year: checked ? "" : prev.end_year,
        };

        setErrors((prevErrors) => ({
          ...prevErrors,
          end_month: "",
          end_year: "",
        }));

        return updated;
      });

      return;
    }

    // ✅ ALL OTHER FIELDS (LIVE VALIDATION)
    setExperience((prev) => {
      const updated = { ...prev, [name]: finalValue };

      const dateErrors = validateDateRange(updated);

      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
        ...dateErrors,
      }));

      return updated;
    });
  };

  const handleSave = () => {

    const validationErrors = validateExperience(experience);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;

    }

    editIndex !== null ? update(editIndex, experience) : append(experience);

    close();
  };

  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const endMonthOptions =
    experience.start_year && experience.end_year &&
      experience.start_year === experience.end_year
      ? months.filter((m) => m >= experience.start_month)
      : months;

  const endYearOptions = experience.start_year
    ? years.filter((y) => y >= experience.start_year)
    : years;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      {/* Modal Container */}
      <div
        className="
          bg-white
          w-full h-full
          rounded-none
          overflow-y-auto

          md:h-auto
          md:max-w-[1000px]
          md:rounded-2xl
          relative
        "
      >
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              {editIndex !== null ? "Edit Employment" : "Add Employment"}
            </h2>

            <button
              onClick={close}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <InputField
              label="Job Title"
              name="job_title"
              value={experience.job_title}
              onChange={handleChange}
              error={errors.job_title}
              placeholder="Ex: Frontend Developer"
            />

            <InputField
              label="Company Name"
              name="company"
              value={experience.company}
              onChange={handleChange}
              error={errors.company}
              placeholder="Ex: Infosys"
            />

            <InputField
              label="Location"
              name="location"
              value={experience.location}
              onChange={handleChange}
              error={errors.location}
              placeholder="Ex: London"
            />

            <InputField
              label="City"
              name="city"
              value={experience.city}
              onChange={handleChange}
              error={errors.city}
              placeholder="Ex: London"
            />

            <InputField
              label="From"
              name="start_month"
              as="select"
              value={experience.start_month}
              onChange={handleChange}
              error={errors.start_month}
              options={months}
              placeholder="From Month"
            />

            <InputField
              label="To"
              name="end_month"
              as="select"
              value={experience.end_month}
              onChange={handleChange}
              error={errors.end_month}
              options={endMonthOptions}
              disabled={experience.is_current}
              placeholder="Through Month"
            />

            <InputField
              label="From"
              name="start_year"
              as="select"
              value={experience.start_year}
              onChange={handleChange}
              error={errors.start_year}
              options={years}
              placeholder="From Year"
            />

            <InputField
              label="To"
              name="end_year"
              as="select"
              value={experience.end_year}
              onChange={handleChange}
              error={errors.end_year}
              options={endYearOptions}
              disabled={experience.is_current}
              placeholder="Through Year"
            />


            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer md:col-span-2">
              <input
                type="checkbox"
                name="is_current"
                checked={experience.is_current}
                onChange={handleChange}
                className="
          appearance-none w-5 h-5 border-2 border-gray-300 rounded-md
          checked:bg-secondary checked:border-secondary relative
          transition-all duration-200
          after:content-['✓'] after:absolute after:text-white
          after:text-sm after:font-bold after:-top-0.5 after:left-0.5
          after:opacity-0 checked:after:opacity-100
        "
              />
              <span className="text-base font-medium">
                I currently work here
              </span>
            </label>

            {/* ✅ Description using COMMON InputField */}
            <div className="md:col-span-2">
              <InputField
                label="Description"
                name="description"
                as="textarea"
                rows={4}
                value={experience.description}
                onChange={handleChange}
                error={errors.description}
                placeholder="Describe your role and responsibilities"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={close}
              variant="lightCard"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              variant="secondaryFilled"
            >
              Save
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ExperienceModal;
