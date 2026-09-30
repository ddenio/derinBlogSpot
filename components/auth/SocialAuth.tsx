import { FaGithub, FaGoogle } from "react-icons/fa";
import Button from "../common/Button";
import { signIn } from "next-auth/react";
import { LOGIN_REDIRECT } from "@/routes";

const SocialAuth = () => {
  const handleOnClick = (provider: "google" | "github") => {
    signIn(provider, {
      redirectTo: LOGIN_REDIRECT,
    });
  };

  return (
    <div className="flex gap-2 flex-col md:flex-row">
      <Button
        type="button"
        label="Continue With Github"
        outlined
        icon={FaGithub}
        onClick={() => handleOnClick("github")}
        className="flex-1"
      />
      <Button
        type="button"
        label="Continue With Google"
        outlined
        icon={FaGoogle}
        onClick={() => handleOnClick("google")}
        className="flex-1"
      />
    </div>
  );
};

export default SocialAuth;
