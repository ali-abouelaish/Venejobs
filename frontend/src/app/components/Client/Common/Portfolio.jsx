import React from "react";

export default function Portfolio({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2">
          <h3 className="font-semibold text-heading text-base">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-paragraph text-xs md:text-base font-normal leading-7">
              {item.description}
            </p>
          )}
          {item.project_url && (
            <a
              href={item.project_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-sm font-medium hover:underline"
            >
              View Project
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
