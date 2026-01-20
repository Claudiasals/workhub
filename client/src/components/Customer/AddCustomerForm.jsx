import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import Drawer from "../Drawer";

const AddCustomerForm = ({ onAdd }) => {
  // Drawer visibility state
  const [isOpen, setIsOpen] = useState(false);

  // Translation helper
  const { t } = useLanguage();

  // Customer form state aligned with backend payload
  const [newCustomer, setNewCustomer] = useState({
    email: "",
    firstName: "",
    lastName: "",
    location: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    birthDate: "",
    fiscalCode: "",
    phoneNumber: "",
    affiliateProgram: {
      name: "standard",
    },
  });

  // Handles flat and nested input updates (dot notation)
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setNewCustomer((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setNewCustomer((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Submits form data and resets local state
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(newCustomer);

    setIsOpen(false);
    setNewCustomer({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      fiscalCode: "",
      birthDate: "",
      location: {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Italia",
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="custom-button text-sm"
      >
        <span className="font-bold mr-2">+</span>
        {t("aggiungiCliente")}
      </button>

      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("aggiungiCliente")}
        width="w-[540px]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm block mb-1">{t("nome")}*</label>
              <input
                name="firstName"
                value={newCustomer.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">{t("cognome")}*</label>
              <input
                name="lastName"
                value={newCustomer.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm block mb-1">{t("email")}*</label>
              <input
                type="email"
                name="email"
                value={newCustomer.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">{t("telefono")}*</label>
              <input
                name="phoneNumber"
                value={newCustomer.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">{t("cf")}*</label>
              <input
                name="fiscalCode"
                value={newCustomer.fiscalCode}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm block mb-1">{t("nascita")}*</label>
              <input
                type="date"
                name="birthDate"
                value={newCustomer.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm block mb-1">{t("indirizzo")}*</label>
              <input
                name="location.address"
                value={newCustomer.location.address}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">{t("citta")}*</label>
              <input
                name="location.city"
                value={newCustomer.location.city}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">{t("provincia")}*</label>
              <input
                name="location.state"
                value={newCustomer.location.state}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">{t("cap")}*</label>
              <input
                name="location.zipCode"
                value={newCustomer.location.zipCode}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">{t("paese")}*</label>
              <input
                name="location.country"
                value={newCustomer.location.country}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>{t("nota")}:</strong> {t("programmaAssegnato")}
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-300 text-[#090c64] font-bold rounded-xl transition"
            >
              {t("annulla")}
            </button>

            <button
              type="submit"
              className="custom-button px-4 py-2"
            >
              {t("salvaCliente")}
            </button>
          </div>
        </form>
      </Drawer>
    </>
  );
};

export default AddCustomerForm;
