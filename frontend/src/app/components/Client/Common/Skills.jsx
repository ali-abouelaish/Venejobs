export default function Skills({ skills = [] }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {skills.length ? (
        skills.map((item) => (
          <p
            className="cursor-pointer relative overflow-hidden
                          bg-[#FAFAFA] p-3 font-medium text-paragraph rounded-full
                          transition-all duration-300
                          before:content-[''] before:absolute before:inset-0
                          before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                          before:-z-10
                          hover:before:translate-x-0
                          z-10 text-base"
            key={item}
          >
            {item}
          </p>
        ))
      ) : (
        <p className="text-paragraph text-sm">No skills available.</p>
      )}
    </div>
  );
}
