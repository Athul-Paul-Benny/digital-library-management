import { useState } from "react";
import {
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../lib/auth";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (isSignUp && !name) {
      setError("Please enter your name.");
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f5f7f6",
        color: "#173f3b",
      }}
    >
      <div
        style={{
          width: "50%",
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#e8f0ee",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#155e59",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <BookOpen size={25} />
          </div>

          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-1px",
            }}
          >
            folio
          </span>
        </div>

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(40px, 5vw, 68px)",
            lineHeight: 1.05,
            margin: 0,
            maxWidth: 600,
          }}
        >
          Your library,
          <br />
          beautifully organized.
        </h1>

        <p
          style={{
            marginTop: 25,
            maxWidth: 500,
            fontSize: 17,
            lineHeight: 1.7,
            color: "#637b78",
          }}
        >
          Manage books, members and borrowing from
          one simple digital library workspace.
        </p>
      </div>

      <div
        style={{
          width: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "white",
            borderRadius: 20,
            padding: 40,
            boxShadow:
              "0 15px 50px rgba(20,60,55,0.08)",
          }}
        >
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 32,
              margin: 0,
            }}
          >
            {isSignUp
              ? "Create your account"
              : "Welcome back"}
          </h2>

          <p
            style={{
              color: "#7a8e8b",
              marginTop: 10,
              marginBottom: 30,
            }}
          >
            {isSignUp
              ? "Start managing your digital library."
              : "Sign in to continue to your library."}
          </p>

          {error && (
            <div
              style={{
                background: "#fff0f0",
                color: "#b64d4d",
                padding: "12px 14px",
                borderRadius: 10,
                marginBottom: 18,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Name
                </label>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #dce5e3",
                    borderRadius: 10,
                    padding: "0 13px",
                  }}
                >
                  <User size={18} color="#8ca09d" />

                  <input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                    style={{
                      border: 0,
                      outline: 0,
                      padding: "13px 10px",
                      flex: 1,
                      fontSize: 15,
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 7,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Email
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #dce5e3",
                  borderRadius: 10,
                  padding: "0 13px",
                }}
              >
                <Mail size={18} color="#8ca09d" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  style={{
                    border: 0,
                    outline: 0,
                    padding: "13px 10px",
                    flex: 1,
                    fontSize: 15,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 25 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 7,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Password
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #dce5e3",
                  borderRadius: 10,
                  padding: "0 13px",
                }}
              >
                <Lock size={18} color="#8ca09d" />

                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  style={{
                    border: 0,
                    outline: 0,
                    padding: "13px 10px",
                    flex: 1,
                    fontSize: 15,
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                    color: "#8ca09d",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 10,
                padding: "14px",
                background: "#155e59",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Please wait..."
                : isSignUp
                ? "Create account"
                : "Sign in"}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 25,
              color: "#7a8e8b",
              fontSize: 14,
            }}
          >
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              style={{
                border: 0,
                background: "transparent",
                color: "#155e59",
                fontWeight: 700,
                cursor: "pointer",
                marginLeft: 5,
              }}
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}