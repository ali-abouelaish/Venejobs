import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import useToastStore from "@/app/store/toastStore";
import React, { useEffect, useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import ShowLanguagePage from "./ShowLanguagePage";
import StepNavigation from "@/app/components/Freelancer/AddProfileDetails/StepNavigation";
import freelancerApiStore from "@/app/store/freelancerApiStore";

const LanguageInputSection = ({
  nextStep,
  prevStep,
  editIndex,
  fields,
  setEditIndex,
  append,
  remove,
  update,
}) => {
  const {
    formState: { errors },
    trigger,
  } = useFormContext();
  const { showError } = useToastStore.getState();

  const languagesData = [
    { id: 1, name: "English" },
    { id: 2, name: "Hindi" },
    { id: 3, name: "Spanish" },
    { id: 4, name: "French" },
    { id: 5, name: "German" },
    { id: 6, name: "Japanese" },
    { id: 7, name: "Chinese" },
  ];

  const proficiencyData = [
    { id: 1, name: "Basic" },
    { id: 2, name: "Conversational" },
    { id: 3, name: "Fluent" },
    { id: 4, name: "Native" },
  ];

  const [languageTemp, setlanguageTemp] = useState({
    language: "",
    proficiency: "",
  });

  const [openLanguage, setOpenLanguage] = useState(false);
  const [openProficiency, setOpenProficiency] = useState(false);
  const languageRef = useRef(null);
  const proficiencyRef = useRef(null);


  useEffect(() => {
    if (editIndex !== null) {
      setlanguageTemp(fields[editIndex]);
    } else {
      setlanguageTemp({
        language: "",
        proficiency: "",
      });
    }
  }, [editIndex, fields]);

  const handleSave = () => {
    if (!languageTemp.language || !languageTemp.proficiency) return;

    const alreadyExists = fields.some(
      (item, idx) =>
        item.language === languageTemp.language && idx !== editIndex
    );

    if (alreadyExists) {
      showError("This language is already added.", "error");
      return;
    }

    if (editIndex !== null) {
      update(editIndex, languageTemp);
    } else {
      append(languageTemp);
    }

    setlanguageTemp({ language: "", proficiency: "" });
    setEditIndex(null);
  };

  const handleEdit = (index) => {
    setlanguageTemp(fields[index]);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    remove(index);
  };

  const handleNext = async () => {
    const valid = await trigger("languages");

    if (fields.length === 0) {
      showError("Please add at least one language before proceeding.", "error");
      return;
    }

    if (valid) nextStep();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target)
      ) {
        setOpenLanguage(false);
      }

      if (
        proficiencyRef.current &&
        !proficiencyRef.current.contains(event.target)
      ) {
        setOpenProficiency(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const selectedLanguages = fields.map((item) => item.language);
  const { personalDetailLoading } = freelancerApiStore();

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          {/* ================= Language ================= */}
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
              Language
            </h2>

            <div className="relative w-full" ref={languageRef}>
              <button
                type="button"
                onClick={() => setOpenLanguage(!openLanguage)}
                className="
                  w-full py-3 px-4
                  border border-gray-300
                  rounded-md
                  text-left
                  bg-white
                  flex justify-between items-center
                  hover:border-secondary
                "
              >
                {languageTemp.language || "Select language"}
                <span className="text-gray-500">
                  <KeyboardArrowDownIcon />
                </span>
              </button>

              {openLanguage && (
                <ul
                  className="
                    absolute z-20 mt-2 w-full
                    bg-white
                    border border-gray-200
                    rounded
                    shadow-lg
                    overflow-hidden
                  "
                >
                  {languagesData
                    .filter(
                      (item) =>
                        editIndex !== null ||
                        !selectedLanguages.includes(item.name)
                    )
                    .map((item) => (
                      <li
                        key={item.id}
                        onClick={() => {
                          setlanguageTemp((prev) => ({
                            ...prev,
                            language: item.name,
                          }));
                          setOpenLanguage(false);
                        }}
                        className="
                          px-4 py-3
                          cursor-pointer
                          hover:bg-secondary/10
                        "
                      >
                        {item.name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* ================= Proficiency ================= */}
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
              Proficiency level
            </h2>

            <div className="relative w-full" ref={proficiencyRef}>
              <button
                type="button"
                onClick={() => setOpenProficiency(!openProficiency)}
                className="
                  w-full py-3 px-4
                  border border-gray-300
                  rounded-md
                  text-left
                  bg-white
                  flex justify-between items-center
                  hover:border-secondary
                "
              >
                {languageTemp.proficiency || "Select proficiency"}
                <span className="text-gray-500">
                  <KeyboardArrowDownIcon />
                </span>

              </button>

              {openProficiency && (
                <ul
                  className="
                    absolute z-20 mt-2 w-full
                    bg-white
                    border border-gray-200
                    rounded
                    shadow-lg
                    overflow-hidden
                  "
                >
                  {proficiencyData.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => {
                        setlanguageTemp((prev) => ({
                          ...prev,
                          proficiency: item.name,
                        }));
                        setOpenProficiency(false);
                      }}
                      className="
                        px-4 py-3
                        cursor-pointer
                        hover:bg-secondary/10
                      "
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ================= Buttons ================= */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="
              px-10 py-3
              bg-secondary text-white
              rounded-lg
              font-semibold
              hover:bg-secondary/90
              cursor-pointer
            "
          >
            {editIndex !== null ? "Update" : "Add"}
          </button>
        </div>

        {
          languagesData &&
          proficiencyData &&
          fields?.length > 0 && (
            <ShowLanguagePage
              fields={fields}
              languagesData={languagesData}
              proficiencyData={proficiencyData}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          )
        }

        {/* Navigation buttons */}
        {/* <StepNavigation
          onNext={handleNext}
          onBack={prevStep}
        /> */}

        <StepNavigation
          isLastStep
          onBack={prevStep}
          loading={personalDetailLoading}
          submitLabel="Let’s Finalize"
        />
      </div>
    </div>
  );
};

export default LanguageInputSection;
