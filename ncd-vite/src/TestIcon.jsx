import React from "react";
import { FaBitcoin } from "react-icons/fa"; // This is a FontAwesome icon

export default function TestIcon() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>React Icons Test</h2>
      <FaBitcoin size={60} color="#f7931a" />
    </div>
  );
}
