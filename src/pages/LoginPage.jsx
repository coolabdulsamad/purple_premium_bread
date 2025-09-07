import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBreadSlice,
  FaUser,
  FaLock,
  FaSignInAlt,
  FaChartLine,
  FaShoppingCart,
  FaIndustry,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Form, Input, Button, Typography, Spin } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "../assets/styles/login.css";
import { ASSETS } from "../assets";
import CustomToast from "../components/CustomToast";

const { Title, Paragraph } = Typography;

const API_BASE_URL =
  "https://purple-premium-bread-backend.onrender.com/api/auth";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    const { username, password } = values;
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });

      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", response.data.role);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // toast.success(
        // `Welcome back, ${response.data.user.fullname || username}!`
        // );
        toast(<CustomToast id={`success-data-${Date.now()}`} type="success" message={`Welcome back, ${response.data.user.fullname || username}!`} />, {
          toastId: 'data-success'
        });

        setTimeout(() => {
          switch (response.data.role) {
            case "admin":
              navigate("/dashboard");
              break;
            case "sales":
              navigate("/pos");
              break;
            case "baker":
              navigate("/production");
              break;
            default:
              navigate("/dashboard");
          }
        }, 1500);
      } else {
        // toast.error("Invalid response from server.");
        toast(<CustomToast id={`error-server-${Date.now()}`} type="error" message="Invalid response from server." />, {
          toastId: 'server-error'
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "An error occurred. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      // toast.error(errorMessage);
      toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMessage} />, {
        toastId: 'error-e'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* <ToastContainer position="top-right" autoClose={3000} theme="light" /> */}

      <div className="login-container">
        {/* Left Side (Form) */} 
        <div className="login-card">
          <div className="logo-container">
            <div className="logo-icon-container">
              {/* <FaBreadSlice className="logo-icon" /> */}
              <img className="logo-icon" src={[ASSETS["logo"]]} alt="Logo" srcset="" />
            </div>
            <Title level={2} style={{ color: "#5E35B1", marginBottom: 8 }}>
              Purple Premium Bread
            </Title>
            <Paragraph style={{ color: "#78909C" }}>
              Sign in to your account
            </Paragraph>
          </div>

          <Form
            name="loginForm"
            layout="vertical"
            onFinish={handleLogin}
          // style={{ maxWidth: 500, margin: "0 auto" }}
          >
            {/* Username */}
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please enter your username" }]}
            >
              <Input
                prefix={<FaUser style={{ color: "#999" }} />}
                placeholder="Enter your username"
                disabled={loading}
              />
            </Form.Item>

            {/* Password */}
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<FaLock style={{ color: "#999" }} />}
                placeholder="Enter your password"
                disabled={loading}
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            {/* Submit */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                icon={loading ? null : <FaSignInAlt />}
                disabled={loading}
              >
                {loading ? <Spin size="small" /> : "Sign In"}
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Right Side (Background Info) */}
        <div className="login-background">
          <div className="background-content">
            <div className="welcome-message">
              <h2>Welcome to Purple Premium Bread</h2>
              <p>
                Manage your bakery operations with our powerful POS and
                production system
              </p>
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <FaShoppingCart />
                </div>
                <div className="feature-text">
                  <h4>Sales Management</h4>
                  <p>Efficiently manage your point of sales</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <FaIndustry />
                </div>
                <div className="feature-text">
                  <h4>Production Tracking</h4>
                  <p>Monitor your baking production process</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <FaChartLine />
                </div>
                <div className="feature-text">
                  <h4>Business Insights</h4>
                  <p>Get valuable insights into your business performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
