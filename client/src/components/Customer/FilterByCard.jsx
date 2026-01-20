import { useLanguage } from "../../context/LanguageContext";

const FilterByCard = ({ onFilter }) => {
  // Translation helper
  const { t } = useLanguage();

  return (
    <select
      onChange={(e) => onFilter(e.target.value)}
      className="custom-button text-sm"
    >
      <option value="">{t("tutteTessere")}</option>
      <option value="standard">Standard</option>
      <option value="premium">Premium</option>
    </select>
  );
};

export default FilterByCard;
