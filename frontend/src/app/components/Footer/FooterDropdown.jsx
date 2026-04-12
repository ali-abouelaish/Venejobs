import Button from "../button/Button";

export default function Footerdropdown() {
  const items = ["Hindi", "Gujarati", "German", "Spanish"];

  return (
    <div className="rounded-lg bg-neutral-900 shadow-lg ring-1 ring-white/10 overflow-hidden">
      <ul className="text-center">
        {items.map((item) => (
          <li key={item}>
            <Button
              className="
                w-full
                text-gray-200
                hover:bg-white/10 hover:text-white
                transition-colors
              "
            >
              {item}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
