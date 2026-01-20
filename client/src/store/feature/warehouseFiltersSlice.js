import { createSlice } from "@reduxjs/toolkit";

// UI-only filters state for the warehouse table
// This slice manages frontend logic only (no backend sync)
const initialState = {
  selectedCategory: "All categories", // Currently selected product category
  searchTerm: "",                     // Text search input
  sortAZ: false,                      // A–Z sorting toggle
  lowStockFilter: false,              // Low stock filter toggle
};

const warehouseFiltersSlice = createSlice({
  name: "warehouseFilters",
  initialState,
  reducers: {
    // Set active category filter
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload;
    },

    // Update search text
    setSearchTerm(state, action) {
      state.searchTerm = action.payload;
    },

    // Toggle alphabetical sorting
    toggleSortAZ(state) {
      state.sortAZ = !state.sortAZ;
    },

    // Toggle low stock filter
    toggleLowStockFilter(state) {
      state.lowStockFilter = !state.lowStockFilter;
    },

    // Reset all filters to default values
    resetFilters(state) {
      state.selectedCategory = "All categories";
      state.searchTerm = "";
      state.sortAZ = false;
      state.lowStockFilter = false;
    },
  },
});

// Export filter actions
export const {
  setSelectedCategory,
  setSearchTerm,
  toggleSortAZ,
  toggleLowStockFilter,
  resetFilters,
} = warehouseFiltersSlice.actions;

// Export reducer
export default warehouseFiltersSlice.reducer;
