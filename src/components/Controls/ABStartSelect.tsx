import { Placeholder } from "./Placeholder";
import { TouchButton } from "./TouchButton";
import { GameBoyButton } from "./useControls";

export const ABStartSelect = () => {
  return (
    <div className="ml-4 flex flex-col">
      <div className="flex flex-row">
        <Placeholder />
        <TouchButton button={GameBoyButton.SELECT}>SELECT</TouchButton>
        <Placeholder />
      </div>
      <div className="flex flex-row">
        <TouchButton button={GameBoyButton.START}>START</TouchButton>
        <Placeholder />
        <TouchButton button={GameBoyButton.A}>A</TouchButton>
      </div>
      <div className="flex flex-row">
        <Placeholder />
        <TouchButton button={GameBoyButton.B}>B</TouchButton>
        <Placeholder />
      </div>
    </div>
  );
};
