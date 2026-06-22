import { Placeholder } from "./Placeholder";
import { TouchButton } from "./TouchButton";
import { GameBoyButton } from "./useControls";

export const ActionButtons = () => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <Placeholder />
        <TouchButton button={GameBoyButton.A}>A</TouchButton>
      </div>
      <div className="flex flex-row">
        <TouchButton button={GameBoyButton.B}>B</TouchButton>
        <Placeholder />
      </div>
    </div>
  );
};

export const StartSelectButtons = () => {
  return (
    <div className="flex flex-row justify-center gap-4">
      <TouchButton button={GameBoyButton.SELECT}>SELECT</TouchButton>
      <TouchButton button={GameBoyButton.START}>START</TouchButton>
    </div>
  );
};
