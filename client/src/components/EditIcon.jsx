import { PencilIcon } from "@phosphor-icons/react";

const EditIcon = ({ color = "#090c64", className, weight = "duotone", size = 20 }) => (
  <PencilIcon
    size={size}
    color={color}
    weight={weight}
    className={className}
  />
);
export default EditIcon;
