import React, { useEffect, useState } from "react";
import Button from "@/app/components/button/Button";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import InputField from "@/app/components/common/InputField";

const INITIAL_EDUCATION = {
  institution_name: "",
  degree: "",
  field_of_study: "",
  type_of_education: "",
  start_date: "",
  end_date: "",
  description: "",
};

const validateEducation = (data) => {
  const errors = {};

  if (!data.institution_name)
    errors.institution_name = "Institution name is required";
  if (!data.degree) errors.degree = "Degree is required";
  if (!data.field_of_study)
    errors.field_of_study = "Field of study is required";
  if (!data.type_of_education)
    errors.type_of_education = "Type of education is required";
  if (!data.description)
    errors.description = "Description is required";

  if (!/^\d{4}$/.test(data.start_date))
    errors.start_date = "Enter valid 4 digit year";

  if (data.end_date && !/^\d{4}$/.test(data.end_date))
    errors.end_date = "Enter valid 4 digit year";

  if (
    data.start_date &&
    data.end_date &&
    Number(data.end_date) < Number(data.start_date)
  ) {
    errors.end_date = "End year cannot be earlier than start year";
  }

  return errors;
};

const EducationModal = ({
  setshowForm,
  close,
  append,
  update,
  editIndex,
  fields,
}) => {
  const [education, setEducation] = useState(INITIAL_EDUCATION);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setEducation(editIndex !== null ? fields[editIndex] : INITIAL_EDUCATION);
  }, [editIndex, fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const yearFields = ["start_date", "end_date"];
    let finalValue = value;

    if (yearFields.includes(name)) {
      finalValue = value.replace(/[^0-9]/g, "");
      if (finalValue.length > 4) return;
    }

    setEducation((prev) => ({ ...prev, [name]: finalValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = () => {
    const validationErrors = validateEducation(education);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    editIndex !== null
      ? update(editIndex, education)
      : append(education);

    setshowForm(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const endYearOptions = education.start_date
    ? years.filter((y) => y >= education.start_date)
    : years;


  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className="
          bg-white
          w-full h-full
          rounded-none
          overflow-y-auto
          md:h-auto
          md:max-h-[90vh]
          md:max-w-[1000px]
          md:rounded-2xl
          relative
        "
      >
        <div className="px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6">

          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
              {editIndex !== null ? "Edit Education" : "Add Education"}
            </h2>
            <button onClick={() => setshowForm(false)} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <SvgIcon name="CrossButton" size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <InputField
              label="Institution Name"
              name="institution_name"
              value={education.institution_name}
              onChange={handleChange}
              error={errors.institution_name}
              placeholder="E.g., University of XYZ"
            />

            <InputField
              label="Degree"
              name="degree"
              value={education.degree}
              onChange={handleChange}
              error={errors.degree}
              placeholder="E.g., Bachelor of Computer Science"
            />

            <InputField
              label="Field of Study"
              name="field_of_study"
              value={education.field_of_study}
              onChange={handleChange}
              error={errors.field_of_study}
              placeholder="E.g., Computer Science"
            />

            <InputField
              label="Type of Education"
              name="type_of_education"
              value={education.type_of_education}
              onChange={handleChange}
              error={errors.type_of_education}
              placeholder="Bachelor’s Degree"
            />

            <InputField
              label="From"
              name="start_date"
              as="select"
              value={education.start_date}
              onChange={handleChange}
              error={errors.start_date}
              options={years}
              placeholder="From Year"
            />

            <InputField
              label="To"
              name="end_date"
              as="select"
              value={education.end_date}
              onChange={handleChange}
              error={errors.end_date}
              options={endYearOptions}
              placeholder="To Year"
            />

          </div>


          <div className="flex flex-col gap-2">
            <label className="font-semibold">Description</label>
            <textarea
              name="description"
              value={education.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your education, achievements, coursework..."
              className="border border-[#D0D5DD] rounded-md p-3 focus:border-secondary outline-0 placeholder:text-sm tracking-wide"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-6 mt-6">
            <Button
              type={"button"}
              onClick={() => setshowForm(false)}
              className="bg-white text-gray-800"
              style={{
                boxShadow: "2px 2px 50px 5px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              Cancel
            </Button>
            <Button type={"button"} className="bg-secondary text-white" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default EducationModal;
