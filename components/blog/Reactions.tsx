import { PiHandsClapping } from "react-icons/pi";
import { FaRegComment } from "react-icons/fa";

const Reactions = () => {
  return (
    <div className="flex items-center gap-4 w-full text-sm">
      <span className="mr-4 flex items-center gap-1 cursor-pointer">
        <PiHandsClapping size={20} />
        {7}
      </span>
      <span className="flex items-center gap-1 cursor-pointer">
        <FaRegComment size={18} />
        {3}
      </span>
    </div>
  );
};

export default Reactions;
