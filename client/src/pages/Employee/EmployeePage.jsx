import { useSelector } from "react-redux"; 
import AdminEmployeePage from "./admin/AdminEmployeePage"; 
import UserEmployeePage from "./user/UserEmployeePage"; 

const EmployeePage = () => {
	const user = useSelector((state) => state.auth.user);

	// If the user has the role 'admin', render the AdminEmployeePage component
	if (user?.role === "admin") return <AdminEmployeePage />;

	// Otherwise, render the UserEmployeePage component
	return <UserEmployeePage />;
};

export default EmployeePage; 
