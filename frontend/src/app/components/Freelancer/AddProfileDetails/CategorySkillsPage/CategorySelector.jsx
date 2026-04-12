import React from "react";
import { useFormContext } from "react-hook-form";
import ComputerIcon from "@mui/icons-material/Computer";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import CampaignIcon from "@mui/icons-material/Campaign";
import SettingsIcon from "@mui/icons-material/Settings";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CategorySkeleton from "@/app/components/Skeletons/CategorySkeleton";

const categoryIcons = {
    it_programming: <ComputerIcon fontSize="small" />,
    design_multimedia: <DesignServicesIcon fontSize="small" />,
    marketing: <CampaignIcon fontSize="small" />,
    admin_support: <SettingsIcon fontSize="small" />,
    writing_translation: <EditNoteIcon fontSize="small" />,
};

const CategorySelector = ({ category_data, getskillsbycategory, loading }) => {
    const { watch, setValue } = useFormContext();
    const selectedCategory = watch("category");

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
                Select the Category
            </h2>

            <ul className="flex flex-wrap gap-3 lg:gap-5">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <CategorySkeleton key={i} />
                    ))
                    : category_data?.map((item) => {
                        const isSelected = selectedCategory === item.code;

                        return (
                            <li key={item.code}>
                                <input
                                    type="radio"
                                    name="category"
                                    id={item.code}
                                    className="sr-only"
                                    checked={isSelected}
                                    onChange={() => {
                                        setValue("category", item.code);
                                        getskillsbycategory(item.code, item.name);
                                    }}
                                />

                                <label
                                    htmlFor={item.code}
                                    className={`
                      flex py-3 px-4 items-center justify-center
                      rounded-lg cursor-pointer
                      border transition-all duration-200
                      ${isSelected
                                            ? "bg-secondary border-secondary text-white"
                                            : "border-[#D0D5DD] hover:border-secondary hover:bg-primary/5 text-heading font-medium"
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
        </div>
    );
};

export default CategorySelector;
