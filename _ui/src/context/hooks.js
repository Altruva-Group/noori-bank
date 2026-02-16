import { useContext } from "react";
import UserAccountContext from "./UserAccountContext";
export { default as UserAccountProvider } from "./UserAccountProvider";

export const useUserAccount = () => useContext(UserAccountContext);

export default useUserAccount;
