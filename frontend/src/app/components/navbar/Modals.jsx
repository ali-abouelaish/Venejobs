import CheckMailScreen from "@/app/components/auth/CheckMailScreen";
import SuccessPassScreen from "@/app/components/auth/SuccessPassScreen";
import SignupForm from "../auth/signup/SignupForm";
import ForgetPasswordWrapper from "../auth/forget-password/ForgetPasswordWrapper";
import Loginform from "../auth/login/Loginform";
import OtpForm from "../auth/otp/OtpForm";
import NewPassword from "../auth/newPassword/NewPassword";

export default function Modals({
  activeModal,
  setActiveModal,
  userEmail,
  setUserEmail,
  verifyCode,
  setverifyCode
}) {
  switch (activeModal) {
    case "signin":
      return <Loginform setActiveModal={setActiveModal} setUserEmail={setUserEmail} />;

    case "signup":
      return (
        <SignupForm
          setActiveModal={setActiveModal}
          setUserEmail={setUserEmail}
          setverifyCode={setverifyCode}
        />
      );

    case "forget_password":
      return <ForgetPasswordWrapper setActiveModal={setActiveModal} setUserEmail={setUserEmail} />;

    case "otp_verify":
      return (
        <OtpForm
          setActiveModal={setActiveModal}
          email={userEmail}
          setverifyCode={verifyCode}
        />
      );

    case "new_password":
      return <NewPassword setActiveModal={setActiveModal} email={userEmail} />;

    case "check_mail_screen":
      return <CheckMailScreen setActiveModal={setActiveModal} />;

    case "success_pass_reset":
      return <SuccessPassScreen setActiveModal={setActiveModal} />;
  }

  return null;
}
