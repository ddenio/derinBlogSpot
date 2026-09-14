const User = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  //could fetch data using the id param

  return <>User Profile: {id}</>;
};

export default User;
