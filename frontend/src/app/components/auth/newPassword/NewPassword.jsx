import NewPasswordModalWrapper from "./NewPasswordModalWrapper";
import NewPasswordHeader from "./NewPasswordHeader";
import NewPasswordForm from "./NewPasswordForm";

export default function NewPassword({ email, setActiveModal }) {
    return (
        <NewPasswordModalWrapper setActiveModal={setActiveModal}>
            <NewPasswordHeader />

            <NewPasswordForm email={email} setActiveModal={setActiveModal} />
        </NewPasswordModalWrapper>
    );
}
