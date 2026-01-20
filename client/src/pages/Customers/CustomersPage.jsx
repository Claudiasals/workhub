import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Table from "../../components/Table";
import FilterByCard from "../../components/Customer/FilterByCard";
import AddCustomerForm from "../../components/Customer/AddCustomerForm";

import { useLanguage } from "../../context/LanguageContext";
import {
  fetchCustomersAsync,
  createCustomerAsync,
  clearError,
} from "../../store/feature/customerSlice";

const CustomersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();

  /* REDUX STATE */
  const { list: customers = [], loading, error } = useSelector(
    (state) => state.customers
  );

  const token =
    useSelector((state) => state.auth?.token) ||
    localStorage.getItem("token");

  /* LOCAL STATE */
  const [cardFilter, setCardFilter] = useState("");

  /* INITIAL FETCH */
  useEffect(() => {
    if (!token) return;
    dispatch(fetchCustomersAsync(token));
  }, [dispatch, token]);

  /* ERROR HANDLING */
  useEffect(() => {
    if (!error) return;
    console.error("Customers error:", error);
    dispatch(clearError());
  }, [error, dispatch]);

  /* FILTERED DATA */
  const filteredCustomers = useMemo(() => {
    if (!cardFilter) return customers;
    return customers.filter(
      (c) => c.affiliateProgram?.name === cardFilter
    );
  }, [customers, cardFilter]);

  /* TABLE CONFIG */
  const columns = useMemo(() => {
    if (filteredCustomers.length === 0) return [];
    return [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "fiscalCode",
      "affiliateProgram.name",
    ];
  }, [filteredCustomers]);

  const columnLabels = {
    firstName: t("nome"),
    lastName: t("cognome"),
    email: t("email"),
    phoneNumber: t("telefono"),
    fiscalCode: t("cf"),
    "affiliateProgram.name": t("tesseraFedelta"),
  };

  const tableData = useMemo(
    () =>
      filteredCustomers.map((c) => ({
        _id: c._id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phoneNumber: c.phoneNumber,
        fiscalCode: c.fiscalCode,
        "affiliateProgram.name": c.affiliateProgram?.name || "—",
      })),
    [filteredCustomers]
  );

  /* CREATE CUSTOMER */
  const handleAddCustomer = async (newCustomer) => {
    if (!token) {
      alert(t("tokenNonDisponibileEffettuaLogin"));
      return;
    }

    try {
      await dispatch(
        createCustomerAsync({
          newCustomer,
          token,
        })
      ).unwrap();
    } catch (err) {
      console.error("Customer creation error:", err);
    }
  };

  /* LOADING STATE */
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <span className="text-[#090c64]">
          {t("caricamentoClienti")}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-8">
      {/* CUSTOMERS TABLE*/}
      <Table
        data={tableData}
        columns={columns}
        columnLabels={columnLabels}
        onRowClick={(row) => navigate(`/customer/${row._id}`)}
        sortLogic={(a, b) => a.firstName.localeCompare(b.firstName)}
        customToolbar={() => (
          <>
            {/* Filter by loyalty card */}
            <FilterByCard onFilter={setCardFilter} />

            {/* Create new customer */}
            <AddCustomerForm onAdd={handleAddCustomer} />
          </>
        )}
      />
    </div>
  );
};

export default CustomersPage;
