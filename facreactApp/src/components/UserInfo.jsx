// src/components/UserInfo.jsx
import React from "react";

export default function UserInfo({ userAccount }) {
  console.log("UserInfo component rendered with userAccount:", userAccount); // Log adicional
  return (
    <div id="userContainer">
      <img src="/images/icon_user.svg" alt="user" />
      <strong>Usuario: </strong>
      <div id="accountInfo">{userAccount}</div>
    </div>
  );
}
