import { auth } from "@/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ErrorPage from "@/components/common/ErrorPage";
import Container from "@/components/layout/Container";
import { parseRange } from "@/lib/analytics/range";

interface AdminProps {
  searchParams: Promise<{ range?: string | string[] }>;
}

const Admin = async ({ searchParams }: AdminProps) => {
  const session = await auth();
  const range = parseRange((await searchParams).range);

  const isAdmin = session?.user.role === "ADMIN";

  if (!isAdmin)
    return (
      <Container>
        <ErrorPage
          variant="forbidden"
          title="Admins only"
          message="This area is only available to site administrators."
        />
      </Container>
    );

  return (
    <Container>
      <AdminDashboard range={range} />
    </Container>
  );
};

export default Admin;
