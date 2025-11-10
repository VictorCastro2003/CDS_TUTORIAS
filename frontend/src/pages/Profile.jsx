import React, { useEffect, useState } from "react";
import { fetchMe } from "../utils/api";

const Profile = ({ token }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchMe(token).then(data => setUser(data));
    }
  }, [token]);

  if (!token) return <p>Please login first</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>Profile</h2>
      <p>ID: {user.id}</p>
      <p>Name: {user.name}</p>
    </div>
  );
};

export default Profile;
