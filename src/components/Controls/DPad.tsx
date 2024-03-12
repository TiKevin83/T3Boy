import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
} from "react-icons/fa";
import { TouchButton } from "./TouchButton";
import { GameBoyButton } from "./useControls";
import { Placeholder } from "./Placeholder";

export const DPad = () => {
  return (
    <div className="mr-4 flex flex-col">
      <div className="flex flex-row">
        <Placeholder />
        <TouchButton button={GameBoyButton.UP}>
          <FaArrowUp />
        </TouchButton>
        <Placeholder />
      </div>
      <div className="flex flex-row">
        <TouchButton button={GameBoyButton.LEFT}>
          <FaArrowLeft />
        </TouchButton>
        <Placeholder />
        <TouchButton button={GameBoyButton.RIGHT}>
          <FaArrowRight />
        </TouchButton>
      </div>
      <div className="flex flex-row">
        <Placeholder />
        <TouchButton button={GameBoyButton.DOWN}>
          <FaArrowDown />
        </TouchButton>
        <Placeholder />
      </div>
    </div>
  );
};
