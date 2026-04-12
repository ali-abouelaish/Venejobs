import Button from "@/app/components/button/Button";
import ServiceSteps from "@/app/components/Freelancer/ServiceStepForm/ServiceSteps";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useFormContext } from "react-hook-form";
import { useRef, useState } from "react";

const ServiceGallery = ({ nextStep, prevStep, currstep }) => {

  const { register, setValue, watch, trigger, formState: { errors }, } = useFormContext();

  const imagesInForm = watch("gallery_images");
  const coverIndex = watch("gallery_cover");

  const inputRef = useRef(null);

  const [images, setImages] = useState(
    (imagesInForm || []).map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
    }))
  );

  const handleFiles = (files) => {
    if (!files) return;

    const newFiles = Array.from(files);

    const updated = [...(imagesInForm || []), ...newFiles];

    setValue("gallery_images", updated, {
      shouldDirty: true,
      shouldValidate: true,
    });

    // Rebuild previews from updated form
    const updatedPreviews = updated.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
    }));

    setImages(updatedPreviews);

    if (coverIndex === null) {
      setValue("gallery_cover", 0);
    }
  };

  register("gallery_images", {
    validate: (value) =>
      Array.isArray(value) && value.length > 0 || "Please upload at least one image",
  });

  const handleNext = async () => {
    const valid = await trigger(["gallery_images", "gallery_cover"]);
    if (valid) nextStep();
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-15">
      <ServiceSteps currstep={currstep} />
      <div className="flex gap-10 lg:gap-15 flex-col">
        <h3 className="text-2xl lg:text-3xl xl:text-[44px] text-heading font-semibold leading-tight">Create a project gallery</h3>
        <div className="flex flex-col gap-4 w-full xl:w-[70%]">
          <div className="flex flex-col gap-4 lg:gap-6">
            <h5 className="text-xl xl:text-2xl text-heading font-semibold leading-9">Project summary</h5>
            <p className="text-lg text-paragraph font-normal">Get noticed by the right buyers with visual examples of your services.
            </p>
            <div className="grid grid-cols-1 gap-5 lg:gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Uploaded Images */}
              {
                images.map((img, index) => (
                  <div key={img.id} className="flex flex-col gap-4.5 rounded-xl">
                    <img
                      src={img.preview}
                      alt="Preview"
                      className="h-62 lg:w-80 rounded-xl object-cover"
                    />

                    <label className="flex cursor-pointer items-center gap-4.5 text-base text-paragraph">
                      <input
                        type="radio"
                        name="gallery_cover"
                        value={index}
                        checked={String(coverIndex) === String(index)}
                        onChange={() => setValue("gallery_cover", index, { shouldValidate: true })}
                        className="h-6 w-6 accent-green-600"
                      />
                      Set as project cover
                    </label>
                  </div>
                ))}

              {/* Upload Box */}
              <div onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                className="flex h-[250px] max-h-[250px] cursor-pointer flex-col items-center justify-center rounded-xl border
            border-[#EAECF0] bg-white px-6 text-center transition hover:border-green-500"
              >
                <input ref={inputRef} type="file" multiple accept="image/*" hidden onChange={(e) =>
                  handleFiles(e.target.files)}
                />

                <div className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border-6 border-[#F9FAFB] bg-[#F2F4F7] text-gray-500">
                    <SvgIcon name="Upload" />
                  </div>

                  <p className="text-base font-normal text-paragraph">
                    <span className="font-semibold text-secondary">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>

                  <p className="text-sm text-paragraph">
                    SVG, PNG, JPG or GIF (max. 800×400px)
                  </p>
                </div>
              </div>
            </div>
            {errors.gallery_images && (
              <p className="text-sm text-red-500 font-medium">
                {errors.gallery_images.message}
              </p>
            )}

          </div>
        </div>
        <div className="flex justify-between">
          <Button
            type="button"
            onClick={prevStep}
            className="bg-white text-paragraph rounded flex items-center gap-2 justify-center" style={{ boxShadow: "2px 2px 50px 5px #0000000D" }}
          >
            <SvgIcon name="LeftArrow" size={18} /> Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="bg-secondary text-white border flex items-center gap-2 justify-center"
          >
            Next <SvgIcon name="NextArrow" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceGallery;
