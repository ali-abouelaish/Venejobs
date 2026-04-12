import React from "react";
import * as Icons from "@/svgIcons";

const SvgIcon = ({ name, size, className = "" }) => {
  const Icon = Icons[name];
  return Icon ? <Icon size={size} className={className} /> : null;
};

export default SvgIcon;