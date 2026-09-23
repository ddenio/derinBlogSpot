import { FaGithub, FaGoogle } from "react-icons/fa";
import Button from "../common/Button";

const SocialAuth = () => {
  return (
    <div className="flex gap-2 flex-col md:flex-row">
      <Button
        type="button"
        label="Continue With Github"
        outlined
        icon={FaGithub}
        onClick={() => {}}
      />
      <Button
        type="button"
        label="Continue With Google"
        outlined
        icon={FaGoogle}
        onClick={() => {}}
      />
    </div>
  );
};

export default SocialAuth;
