import Button from "../button/Button";

export default function HeroButtons() {
    return (
        <div className="flex gap-4 w-full">
            <Button
                variant="primary"
            >
                Find Freelancer
            </Button>

            <Button
                className="bg-white text-neutral-500"
                variant="secondary"
            >
                Find Work
            </Button>
        </div>
    );
}
