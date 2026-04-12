export default function Loader({ size = 20, border = 2, color = "white" }) {
    return (
        <span
            className="inline-block rounded-full animate-spin"
            style={{
                width: size,
                height: size,
                borderWidth: border,
                borderStyle: "solid",
                borderColor: color,
                borderTopColor: "transparent",
            }}
        ></span>
    );
}
