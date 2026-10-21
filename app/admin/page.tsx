import { auth } from "@/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ErrorPage from "@/components/common/ErrorPage";
import Container from "@/components/layout/Container";

const Admin = async () => {
  const session = await auth();

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
      <AdminDashboard />
    </Container>
  );
};

export default Admin;
