export default function OtpInputs({ otp, setOtp, setFinalOtp, inputRefs }) {

    const handleChange = (index, e) => {
        const value = e.target.value;

        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }

        if (newOtp.join("").length === 6) {
            setFinalOtp(newOtp.join(""));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace") {
            if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").trim();

        if (!/^\d{6}$/.test(pasteData)) return;

        const pasteArray = pasteData.split("");
        setOtp(pasteArray);
        setFinalOtp(pasteData);

        // focus last input
        inputRefs.current[5].focus();
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3 mt-2 px-4">
            {otp.map((value, index) => (
                <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={value}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="
                        w-10 h-10 sm:w-14 sm:h-14 
                        rounded-lg lg:rounded-xl text-center text-lg sm:text-xl 
                        border border-gray-500
                        focus:border-primary focus:ring-1 focus:ring-primary
                        outline-none text-heading font-medium
                        transition-all
                    "
                />
            ))}
        </div>
    );
}
