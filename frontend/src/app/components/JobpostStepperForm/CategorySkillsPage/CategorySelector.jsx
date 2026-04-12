import { React, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import ComputerIcon from "@mui/icons-material/Computer";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import CampaignIcon from "@mui/icons-material/Campaign";
import SettingsIcon from "@mui/icons-material/Settings";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CategorySkeleton from "../../Skeletons/CategorySkeleton";
import jobApiStore from "@/app/store/jobStore";

const categoryIcons = {
    it_programming: <ComputerIcon fontSize="small" />,
    design_multimedia: <DesignServicesIcon fontSize="small" />,
    marketing: <CampaignIcon fontSize="small" />,
    admin_support: <SettingsIcon fontSize="small" />,
    writing_translation: <EditNoteIcon fontSize="small" />,
};

const CategorySelector = () => {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const selectedCategory = watch("category");
    const { category_data, getCategories, getSkillsByCategory, categoryLoading } =
        jobApiStore();

    useEffect(() => {
        getCategories();
    }, []);

    const getskillsbycategory = async (item) => {
        // Deselect category
        if (selectedCategory === item.code) {
            setValue("category", "");
            setValue("skills", []);
            return;
        }

        // Select category
        setValue("category", item.code);
        setValue("skills", []);
        await getSkillsByCategory(item.code);
    };
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
                Select the Category
            </h2>

            <ul className="flex flex-wrap gap-3 lg:gap-5">
                {categoryLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <CategorySkeleton key={i} />
                    ))
                    : category_data?.map((item) => {
                        const isSelected = selectedCategory === item.code;

                        return (
                            <li key={item.code}>
                                {/* RADIO INPUT */}
                                <input
                                    type="radio"
                                    id={item.code}
                                    value={item.code}
                                    {...register("category", { required: "Please select a category" })}
                                    checked={isSelected}
                                    className="sr-only"
                                    onClick={() => {
                                        getskillsbycategory(item)
                                    }}
                                />

                                <label
                                    htmlFor={item.code}
                                    className={`
                      flex py-3 px-4 items-center justify-center
                      rounded-lg cursor-pointer
                      border transition-all duration-200

                      ${isSelected
                                            ? "bg-primary border-primary text-white"
                                            : "border-[#D0D5DD] hover:border-primary hover:bg-primary/2 text-heading font-medium"
                                        }
                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm lg:text-base">
                                            {item.name}
                                        </span>
                                        <div className="text-inherit">
                                            {categoryIcons[item.code]}
                                        </div>
                                    </div>
                                </label>
                            </li>
                        );
                    })}
            </ul>

            {/* ERROR */}
            {errors?.category && (
                <span className="text-sm text-red-500 font-medium">
                    {errors.category.message}
                </span>
            )}
        </div>
    );
};

export default CategorySelector;
