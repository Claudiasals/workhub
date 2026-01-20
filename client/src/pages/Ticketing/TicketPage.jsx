import { useSelector } from "react-redux";
import TicketPageAdmin from "./TicketPageAdmin";
import TicketCreator from "./TicketCreator";

// Main component for the Ticket Page
const TicketPage = () => {
	// Get the current user from the Redux store
	const user = useSelector((state) => state.auth.user); // Get the user from Redux state

	// If the user is an admin, render the admin ticket page
	if (user?.role === "admin") return <TicketPageAdmin />; // If user is admin, show admin page, otherwise show user page

	// Otherwise, render the ticket creator page for regular users
	return <TicketCreator />;
};

export default TicketPage;
