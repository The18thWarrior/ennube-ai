const ADMIN_LIST = process.env.ADMIN_LIST?.split(",");

const isAdmin = (userId: string | undefined) => {
  if (!userId) return false;
  if (!ADMIN_LIST) return false;
  return ADMIN_LIST.includes(userId);
};


export { isAdmin };