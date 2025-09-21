import { useEffect, useState } from "react";

type User = {
  email?: string;
  username?: string;
  name?: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:3000/me", {
        credentials: "include",
      });
      if (res.status === 401) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:3000/login";
  };

  const handleLogout = () => {
    window.location.href = "http://localhost:3000/logout";
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>React + Cognito Demo</h1>

      {user ? (
        <>
          <h2>Welcome, {user.username || user.email}</h2>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <p>Please log in</p>
          <button onClick={handleLogin}>Login</button>
        </>
      )}
    </div>
  );
}

export default App;
