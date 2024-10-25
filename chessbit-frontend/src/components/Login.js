import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = { email, password };
      const res = await axios.post('/api/auth/login', user);
      console.log('Login successful:', res.data);
      localStorage.setItem('token', res.data.token);
      // Redirect or update UI after successful login
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Extract the error message from the response
        const errorMsg =
          err.response.data.errors && err.response.data.errors[0]
            ? err.response.data.errors[0].msg
            : 'Invalid credentials';
        alert(`Login failed: ${errorMsg}`);
      } else if (err.response) {
        console.error('Server error:', err.response.data);
        alert(`Login failed: ${err.response.data.msg || 'Unknown error'}`);
      } else if (err.request) {
        console.error('No response from server:', err.request);
        alert('No response from the server. Please try again later.');
      } else {
        console.error('Error setting up request:', err.message);
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        type="email"
        placeholder="Email Address"
        name="email"
        value={email}
        onChange={onChange}
        required
      />
      <input
        type="password"
        placeholder="Password"
        name="password"
        value={password}
        onChange={onChange}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;