import { auth } from "@/auth";
import ErrorPage from "@/components/common/ErrorPage";
import EditUserForm from "@/components/user/EditUserForm";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";

const EditUser = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const user = await getUserById(id);

  if (!user) return (
    <ErrorPage
      variant="notFound"
      title="User not found"
      message="This profile doesn't exist."
    />
  );

  const session = await auth();

  if (session?.user.userId !== user.id)
    return (
      <ErrorPage
        variant="forbidden"
        title="You can't edit this profile"
        message="You can only edit your own profile."
      />
    );

  const account = await db.account.findFirst({
    where: { userId: user.id },
  });

  const isOAuth =
    account?.provider === "google" || account?.provider === "github";

  const isCredentials = !isOAuth;

  // Only pass what the form needs to the client; never the password hash
  const formUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    tags: user.tags,
  };

  return <EditUserForm user={formUser} isCredentials={isCredentials} />;
};

export default EditUser;
