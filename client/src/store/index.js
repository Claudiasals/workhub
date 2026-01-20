import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./feature/authSlice";
import eventReducer from "./feature/eventsSlice";
import userReducer from "./feature/userSlice";
import pointOfSalesReducer from "./feature/pointOfSalesSlice";
import shiftsReducer from "./feature/shiftsSlice";
import leaveReducer from "./feature/userLeave";
import orderReducer from "./feature/orderSlice";
import productReducer from "./feature/productsSlice";
import itemsReducer from "./feature/itemsSlice";
import warehouseFiltersReducer from "./feature/warehouseFiltersSlice";
import customerSlice from "./feature/customerSlice";
import ticketReducer from "./feature/ticketSlice";

const store = configureStore({
	reducer: {
		auth: authReducer,
		users: userReducer,
		pos: pointOfSalesReducer,
		events: eventReducer,
		shifts: shiftsReducer,
		leave: leaveReducer,
		orders: orderReducer,
		products: productReducer,
		items: itemsReducer,
		warehouseFilters: warehouseFiltersReducer,
		customers: customerSlice,
		tickets: ticketReducer,
	},
});

export default store;
