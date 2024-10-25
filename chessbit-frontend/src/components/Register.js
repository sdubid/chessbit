import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });

  const { username, email, password, password2 } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      alert('Passwords do not match');
    } else {
      try {
        const { data } = await axios.post('/api/auth/register', {
          username,
          email,
          password,
        });
        console.log('User registered:', data);
        // Handle successful registration
      } catch (err) {
        if (err.response && err.response.data && err.response.data.errors) {
          const errorMsgs = err.response.data.errors.map((error) => error.msg);
          alert(`Registration failed: ${errorMsgs.join(', ')}`);
        } else {
          console.error('Unexpected error:', err.message);
          alert('Something went wrong. Please try again.');
        }
      }
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Username"
        name="username"
        value={username}
        onChange={onChange}
        required
      />
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
      <input
        type="password"
        placeholder="Confirm Password"
        name="password2"
        value={password2}
        onChange={onChange}
        required
      />
      <input type="submit" value="Register" />
    </form>
  );
}

export default Register;