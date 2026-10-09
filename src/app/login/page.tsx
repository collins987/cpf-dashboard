import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — CPF Group Analytics Dashboard",
};

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F7FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body), sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
          padding: "40px 36px",
          width: "100%",
          maxWidth: 380,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#1b3557",
            color: "#fff",
            fontSize: 20,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          CPF
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f1f35", marginBottom: 6 }}>
          CPF Group Analytics
        </div>
        <div style={{ fontSize: 13, color: "#8b93a1", marginBottom: 32 }}>
          You have been signed out.
        </div>
        <Link
          href="/rukisha"
          style={{
            display: "block",
            background: "#0f1f35",
            color: "#fff",
            borderRadius: 8,
            padding: "10px 0",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Sign back in
        </Link>
        <div style={{ marginTop: 20, fontSize: 11, color: "#c3cedb" }}>
          Prototype dashboard · illustrative dummy data
        </div>
      </div>
    </div>
  );
}
