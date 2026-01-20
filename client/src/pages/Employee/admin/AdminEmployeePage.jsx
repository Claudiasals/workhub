import { useTheme } from "../../../context/ThemeContext.jsx";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import {
  UsersThreeIcon,
  UserCircleMinusIcon,
  NotePencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchUsersAsync,
  createUserAsync,
  updateUserAsync,
  deleteUserAsync,
} from "../../../store/feature/userSlice";
import { fetchPointsOfSalesAsync } from "../../../store/feature/pointOfSalesSlice";
import { fetchAllShiftsAsync } from "../../../store/feature/shiftsSlice";

import Drawer from "../../../components/Drawer";
import Table from "../../../components/Table";

const AdminEmployeePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  // Redux state
  const { list: employees = [], loading, error } = useSelector(
    (state) => state.users || {}
  );
  const { list: pointsOfSale = [] } = useSelector(
    (state) => state.pos || {}
  );
  const { token } = useSelector((state) => state.auth || {});

  // UI state
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Fetch initial data
  useEffect(() => {
    if (!token) return;
    dispatch(fetchUsersAsync(token));
    dispatch(fetchPointsOfSalesAsync({ token }));
    dispatch(fetchAllShiftsAsync({ token }));
  }, [dispatch, token]);

  // Stats
  const stats = [
    {
      label: t("dipendentiAttivi"),
      value: employees.length,
      icon: (
        <UsersThreeIcon
          size={28}
          color={theme === "dark" ? "white" : "#090c64"}
          weight="duotone"
        />
      ),
    },
    {
      label: t("dipendentiInattivi"),
      value: employees.filter((e) => e.onVacation).length,
      icon: (
        <UserCircleMinusIcon
          size={28}
          color={theme === "dark" ? "white" : "#090c64"}
          weight="duotone"
        />
      ),
    },
  ];

  // Prepare table data
  const tableData = useMemo(() => {
    return employees.map((e) => ({
      _id: e._id,
      name: `${e.firstName} ${e.lastName}`,
      department: e.department,
      email: e.email,
      personnelNumber: e.personnelNumber,
      contractType: e.contractType || "-",
      raw: e,
    }));
  }, [employees]);

  const columns = ["name", "department",  "email", "personnelNumber", "contractType"];
  const columnLabels = {
    name: t("nome"),
    department: t("ruolo"),
    email: t("email"),
    personnelNumber: t("matricola"),
    contractType: t("tipoContratto"),
  };

  // Navigation
  const openEmployeeDetails = (employee) => {
    navigate(`/personale/${employee._id}`);
  };

  // Create employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!token) return;

    const form = e.target;
    const [firstName, ...rest] = form.nome.value.trim().split(" ");

    const newUser = {
      firstName,
      lastName: rest.join(" "),
      username: form.username.value.trim(),
      email: form.email.value.trim(),
      phone: form.telefono.value.trim() || undefined,
      department: form.ruolo.value.trim(),
      personnelNumber: Number(form.personnelNumber.value),
      workplace: form.sede.value,
      contractType: form.contratto.value || undefined,
      hireDate: form.dataAssunzione.value
        ? new Date(form.dataAssunzione.value)
        : undefined,
      role: form.role.value,
    };

    try {
      const res = await dispatch(
        createUserAsync({ newUser, token })
      ).unwrap();

      setGeneratedPassword(res.tempPassword || "");
      setToastMessage(t("dipendenteCreato"));
      setTimeout(() => setToastMessage(""), 3000);
      form.reset();
    } catch {
      setToastMessage(t("erroreCreazioneDipendente"));
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  // Edit employee
  const openEditDrawer = (employee) => {
    setSelectedEmployee({
      ...employee,
      hireDate: employee.hireDate
        ? new Date(employee.hireDate).toISOString().slice(0, 10)
        : "",
    });
    setEditDrawerOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditCancel = () => {
    setEditDrawerOpen(false);
    setSelectedEmployee(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee || !token) return;

    try {
      await dispatch(
        updateUserAsync({
          id: selectedEmployee._id,
          updates: selectedEmployee,
          token,
        })
      ).unwrap();
      handleEditCancel();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (employee) => {
    if (!token) return;

    if (
      !window.confirm(
        `${t("vuoiEliminare")} ${employee.firstName} ${employee.lastName}?`
      )
    )
      return;

    dispatch(deleteUserAsync({ id: employee._id, token }));
  };

  return (
    <div className="w-full h-full flex flex-col gap-8 overflow-y-auto p-4">
      {/* STATS + ADD EMPLOYEE */}
      <section className="grid grid-cols-3 gap-6 items-center">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 border border-white/90 shadow-md bg-[#fafafa20] dark:bg-[#fafafa10] ${textColor}`}
          >
            {s.icon}
            <span className="font-bold">
              {s.label}: {s.value}
            </span>
          </div>
        ))}

        <div
          onClick={() => setCreateDrawerOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 border border-white/90 shadow-md cursor-pointer font-bold bg-[#fafafa20] dark:bg-[#fafafa10]"
        >
          <span className="text-xl">+</span>
          {t("aggiungiDipendente")}
        </div>
      </section>

      {/* EMPLOYEE TABLE */}
      <Table
        data={tableData}
        columns={columns}
        columnLabels={columnLabels}
        onRowClick={(row) => openEmployeeDetails(row.raw)}
        actionLabel={t("azioni")}
        actions={[
          {
            name: "edit",
            icon: (
              <NotePencilIcon
                size={26}
                color={theme === "dark" ? "white" : "#090c64"}
                weight="duotone"
              />
            ),
            onClick: (row) => openEditDrawer(row.raw),
          },
          {
            name: "delete",
            icon: (
              <TrashIcon
                size={26}
                color={theme === "dark" ? "#ff4d4d" : "#ff0000"}
                weight="duotone"
              />
            ),
            onClick: (row) => handleDeleteUser(row.raw),
          },
        ]}
      />

      {/* CREATE DRAWER */}
      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title={t("nuovoDipendente")}
      >
        <form onSubmit={handleAddEmployee} className="flex flex-col gap-4">
          <input name="nome" placeholder={t("nomeCompleto")} required className="p-2 border rounded-xl" />
          <input name="ruolo" placeholder={t("ruolo")} required className="p-2 border rounded-xl" />
          <input name="username" placeholder="Username" required className="p-2 border rounded-xl" />
          <input name="email" type="email" placeholder="Email" required className="p-2 border rounded-xl" />
          <input name="telefono" placeholder={t("telefono")} className="p-2 border rounded-xl" />
          <input name="personnelNumber" type="number" placeholder={t("matricola")} required className="p-2 border rounded-xl" />

          <select name="sede" required className="p-2 border rounded-xl">
            <option value="">{t("sedeLavorativa")}</option>
            {pointsOfSale.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} – {p.location?.city}
              </option>
            ))}
          </select>

          <select name="contratto" className="p-2 border rounded-xl">
            <option value="">{t("tipoContratto")}</option>
            <option value="indeterminato">{t("indeterminato")}</option>
            <option value="determinato">{t("determinato")}</option>
            <option value="part-time">{t("partTime")}</option>
          </select>

          <input name="dataAssunzione" type="date" className="p-2 border rounded-xl" />

          <select name="role" required className="p-2 border rounded-xl">
            <option value="">{t("ruoloAccount")}</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <input
            value={generatedPassword}
            readOnly
            placeholder={t("passwordGenerata")}
            className="p-2 border rounded-xl col-span-2 bg-gray-100"
          />

          <div className="col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateDrawerOpen(false)}
              className="px-4 py-2 border rounded-xl"
            >
              {t("annulla")}
            </button>
            <button type="submit" className="px-4 py-2 custom-button">
              {t("crea")}
            </button>
          </div>
        </form>

        {toastMessage && (
          <div className="mt-3 p-2 text-center rounded-xl bg-green-500 text-white">
            {toastMessage}
          </div>
        )}
      </Drawer>

      {/* EDIT DRAWER */}
      <Drawer
        open={editDrawerOpen}
        onClose={handleEditCancel}
        title={t("modificaDipendente")}
        width="w-[420px]"
      >
        {selectedEmployee && (
          <div className="flex flex-col gap-4">
            <input name="firstName" value={selectedEmployee.firstName} onChange={handleEditChange} className="p-2 border rounded" />
            <input name="lastName" value={selectedEmployee.lastName} onChange={handleEditChange} className="p-2 border rounded" />
            <input name="department" value={selectedEmployee.department} onChange={handleEditChange} className="p-2 border rounded" />
            <input name="email" value={selectedEmployee.email} onChange={handleEditChange} className="p-2 border rounded" />
            <input name="phone" value={selectedEmployee.phone || ""} onChange={handleEditChange} className="p-2 border rounded" />
            <input name="personnelNumber" type="number" value={selectedEmployee.personnelNumber} onChange={handleEditChange} className="p-2 border rounded" />
            <input name="hireDate" type="date" value={selectedEmployee.hireDate} onChange={handleEditChange} className="p-2 border rounded" />
            <select name="contractType" value={selectedEmployee.contractType || ""} onChange={handleEditChange} className="p-2 border rounded">
              <option value="">{t("tipoContratto")}</option>
              <option value="indeterminato">{t("indeterminato")}</option>
              <option value="determinato">{t("determinato")}</option>
              <option value="part-time">{t("partTime")}</option>
            </select>
            <select name="workplace" value={selectedEmployee.workplace} onChange={handleEditChange} className="p-2 border rounded">
              <option value="">{t("sedeLavorativa")}</option>
              {pointsOfSale.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} – {p.location?.city}
                </option>
              ))}
            </select>
            <select name="role" value={selectedEmployee.role} onChange={handleEditChange} className="p-2 border rounded">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex gap-4 mt-4">
              <button onClick={handleEditCancel} className="flex-1 custom-button-light">
                {t("annulla")}
              </button>
              <button onClick={handleSaveEdit} className="flex-1 custom-button">
                {t("salva")}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {error && (
        <p className="text-red-500 text-center mt-2">
          {error}
        </p>
      )}
    </div>
  );
};

export default AdminEmployeePage;
