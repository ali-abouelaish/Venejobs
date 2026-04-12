import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";

export default function CustomToast({ title, message, type = "success" }) {
  const TYPES = {
    success: {
      bg: "bg-green-100",
      icon: <CheckCircleIcon className="text-green-600 w-5! h-5!" />,
      border: "border-green-200",
    },
    error: {
      bg: "bg-red-100",
      icon: <ErrorIcon className="text-red-600 w-5! h-5!" />,
      border: "border-red-200",
    },
    warning: {
      bg: "bg-yellow-100",
      icon: <WarningIcon className="text-yellow-600 w-5! h-5!" />,
      border: "border-yellow-300",
    },
    info: {
      bg: "bg-blue-100",
      icon: <InfoIcon className="text-blue-600 w-5! h-5!" />,
      border: "border-blue-200",
    },
  };

  const style = TYPES[type] || TYPES.success;

  return (
    <div
      className={`
        w-[360px] flex items-center gap-4 p-4
        bg-white rounded-xl
        shadow-[0_8px_20px_rgba(0,0,0,0.06)]
        border ${style.border}
      `}
    >
      {/* Icon */}
      <div
        className={`
          w-8 h-8 flex items-center justify-center 
          rounded-full ${style.bg}
        `}
      >
        {style.icon}
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <p className="text-sm text-gray-800 font-sans">{title}</p>
      </div>
    </div>
  );
}
