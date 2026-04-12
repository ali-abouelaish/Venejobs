import React from "react";

export const Upload = ({
  size = 18,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.83203 11.6666L9.16536 8.33325M9.16536 8.33325L12.4987 11.6666M9.16536 8.33325V15.8333M15.832 12.2856C16.85 11.445 17.4987 10.1732 17.4987 8.74992C17.4987 6.21861 15.4467 4.16659 12.9154 4.16659C12.7333 4.16659 12.5629 4.07158 12.4705 3.9147C11.3837 2.07062 9.37739 0.833252 7.08203 0.833252C3.63025 0.833252 0.832031 3.63147 0.832031 7.08325C0.832031 8.80501 1.52824 10.3642 2.65449 11.4945" stroke="#475467" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>

  );
};

export default Upload;
