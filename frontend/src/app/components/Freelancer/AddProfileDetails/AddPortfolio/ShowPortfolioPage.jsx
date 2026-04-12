import SvgIcon from "@/app/components/Utility/SvgIcon";
import AddIcon from "@mui/icons-material/Add";
import React from "react";

const ShowPorfolioPage = ({ fields, onEdit, onDelete, onAddMore }) => {
  if (!fields || fields.length === 0) {
    return <p className="text-gray-500">No education added yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl xl:text-2xl text-heading font-semibold leading-9">
          Portfolio History
        </h2>
        <button
          type="button"
          className="px-2 py-2 bg-secondary text-white w-fit rounded-full"
          onClick={onAddMore}
        >
          <AddIcon />
        </button>
      </div>
      {fields.map((item, index) => (
        <div
          key={index}
          className="border border-gray-200 p-4 rounded-lg flex md:flex-row justify-between items-center md:items-center gap-4"
        >
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-base md:text-lg">{item.title}</h2>
            <p className="text-gray-600 text-sm md:text-base">{item.project_url}</p>
          </div>

          <div className="flex">
            <button
              type="button"
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-secondary rounded-full cursor-pointer
                transition-all duration-300 ease-out
                hover:scale-105
                active:scale-95"
              onClick={() => onEdit(index)}
            >
              <SvgIcon name="Editing" size={20} />
            </button>

            <button
              type="button"
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-red-500 rounded-full cursor-pointer
                transition-all duration-300 ease-out
                hover:scale-105
                active:scale-95"
              onClick={() => onDelete(index)}
            >
              <SvgIcon name="Delete1" size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShowPorfolioPage;
