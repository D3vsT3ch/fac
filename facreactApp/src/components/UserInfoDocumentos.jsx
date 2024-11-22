// src/components/UserInfo.jsx
import React from "react";
import PropTypes from 'prop-types';

export default function UserInfo({ userEOA, userAccount }) {
  console.log("UserInfo component rendered with userEOA:", userEOA, "and userAccount:", userAccount);
  return (
    <div id="userContainerAdmin" className={'useradmin ' + (userEOA ? 'visible' : '')}>
      <img src="/images/icon_user.svg" alt="user" />
      <strong>Dirección EOA: </strong>
      <div id="accountInfo">{userEOA}</div>
      <br />
      <strong>Smart Account: </strong>
      <div id="accountInfo">{userAccount}</div>
    </div>
  );
}

UserInfo.propTypes = {
  userEOA: PropTypes.string,
  userAccount: PropTypes.string,
};
