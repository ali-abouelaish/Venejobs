import CategorySlider from "../BrowseCategories/CategorySlider";
import { categories } from "../BrowseCategories/data";
import Button from "../button/Button";
import SvgIcon from "../Utility/SvgIcon";

export default function BrowseCategories() {
  return (
    <section className="w-full">
      {/* HEADER */}
      <div
        className="
                flex flex-col gap-4 
                sm:flex-row 
                justify-between 
                 sm:items-start lg:items-center
                text-center sm:text-left 
                mb-8
            "
      >
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl lg:text-3xl xl:text-[44px] font-semibold leading-tight text-heading">
            Browse talent by category
          </h2>

          <p className="text-gray-500 text-sm md:text-base font-medium">
            Get some Inspirations from 1800+ skills
          </p>
        </div>

        {/* CENTER BUTTON ON MOBILE */}
        <div className="flex justify-center sm:justify-end w-full sm:w-auto">
          <button
            type="button"
            className="flex items-center gap-2 text-primary font-semibold rounded-md px-2"
          >
            All Category
            <SvgIcon name="RightOne" />
          </button>
        </div>
      </div>

      {/* SLIDER */}
      <div className="flex justify-center sm:justify-start">
        <CategorySlider items={categories} />
      </div>
    </section>
  );
}
