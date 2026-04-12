
import Jobs from "../../jobs/client/Jobs";
import ActiveContracts from "../ActiveContracts/ActiveContracts";

export default function JobContent({ showData }) {
  return (
    <div className="mt-10 relative min-h-[70vh]">

      <div
        className={`transition-opacity duration-300 ${showData === 0 ? "opacity-100" : "opacity-0 hidden"
          }`}
      >
        <Jobs />
      </div>

      <div
        className={`transition-opacity duration-300 ${showData === 1 ? "opacity-100" : "opacity-0 hidden"
          }`}
      >
        <ActiveContracts />
      </div>

    </div>
  );
}
