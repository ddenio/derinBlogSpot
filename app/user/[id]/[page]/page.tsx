import { auth } from "@/auth";
import ErrorPage from "@/components/common/ErrorPage";
import UserProfile from "@/components/user/UserProfile";
import { db } from "@/lib/db";

const Profile = async ({
  params,
}: {
  params: Promise<{ id: string; page: string }>;
}) => {
  const { id, page } = await params;
  const session = await auth();
  const currentUid = session?.user.userId;

  const user = await db.user.findUnique({
    where: { id },
    // Explicit select: never load email, password hash, etc. for a public page
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      tags: true,
      createdAt: true,
      followers: {
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              image: true,
              followers: {
                where: { followerId: currentUid },
                select: { id: true },
              },
            },
          },
        },
      },
      followings: {
        include: {
          following: {
            select: {
              id: true,
              name: true,
              image: true,
              followers: {
                where: { followerId: currentUid },
                select: { id: true },
              },
            },
          },
        },
      },

      _count: {
        select: {
          followers: true,
          followings: true,
        },
      },
    },
  });

  if (!user) return (
    <ErrorPage
      variant="notFound"
      title="User not found"
      message="This profile doesn't exist."
    />
  );

  const follow = await db.follow.findFirst({
    where: {
      followerId: currentUid,
      followingId: user.id,
    },
  });

  return <UserProfile user={user} page={page} isFollowing={Boolean(follow)} />;
};

export default Profile;
