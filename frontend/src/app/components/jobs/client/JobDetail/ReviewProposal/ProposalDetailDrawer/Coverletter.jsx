import CoverletterDetail from "./CoverletterDetail";
import CoverletterRightPanel from "./CoverletterRightPanel";

const Coverletter = () => {
  return (
    <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-6">
      <CoverletterDetail />
      <CoverletterRightPanel />
    </div>
  );
};
export default Coverletter;
