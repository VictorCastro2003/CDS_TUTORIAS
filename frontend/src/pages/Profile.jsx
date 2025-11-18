import React, { useEffect, useState } from "react";
import { fetchMe } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (authUser) {
      setUser(authUser);
      return;
    }
    if (token) fetchMe(token).then(data => setUser(data));
  }, [authUser]);

  if (!localStorage.getItem('token')) return <p>Please login first</p>;
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
