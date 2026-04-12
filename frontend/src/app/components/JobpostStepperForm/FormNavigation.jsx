import Button from "../button/Button";

const FormNavigation = ({ step, totalSteps, nextStep, prevStep }) => {
  return (
    <div style={{ marginTop: "1rem" }}>
      {step > 1 && (
        <Button type="button" onClick={prevStep}>
          Back
        </Button>
      )}
      {step < totalSteps ? (
        <Button type="button" onClick={nextStep}>
          Next
        </Button>
      ) : (
        <Button type="submit">Submit</Button>
      )}
    </div>
  );
};

export default FormNavigation;
