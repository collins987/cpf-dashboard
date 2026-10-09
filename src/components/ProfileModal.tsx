"use client";

import { useEffect, useRef } from "react";

interface ProfileModalProps {
  onClose: () => void;
}

const USER = {
  initials: "VC",
  name: "Vincent Collins",
  email: "vcollins@cpf.or.ke",
  role: "Finance Manager",
  department: "Group Finance",
  company: "CPF Group",
  accessLevel: "Full Access — All Subsidiaries",
  subsidiaries: ["Rukisha", "CPF Financial Services", "CPF Capital & Advisory"],
};

function formatLastLogin(): string {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `Today, ${time}`;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="modaloverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Personal Profile"
    >
      <div className="profilemodal" ref={dialogRef}>
        <button className="profilemodalclose" onClick={onClose} aria-label="Close">
          ×
        </button>

        {/* Avatar + identity */}
        <div className="profilemodalhead">
          <div className="profilemodalavatar">{USER.initials}</div>
          <div>
            <div className="profilemodalname">{USER.name}</div>
            <div className="profilemodalemail">{USER.email}</div>
            <div className="profilemodalrole">{USER.role}</div>
          </div>
        </div>

        <div className="profilemodaldivider" />

        {/* Personal info */}
        <div className="profilemodalsection">
          <div className="profilemodalsectiontitle">Personal Information</div>
          <div className="profilemodalrow">
            <span className="profilemodallabel">Full Name</span>
            <span className="profilemodalvalue">{USER.name}</span>
          </div>
          <div className="profilemodalrow">
            <span className="profilemodallabel">Email</span>
            <span className="profilemodalvalue">{USER.email}</span>
          </div>
          <div className="profilemodalrow">
            <span className="profilemodallabel">Role</span>
            <span className="profilemodalvalue">{USER.role}</span>
          </div>
          <div className="profilemodalrow">
            <span className="profilemodallabel">Department</span>
            <span className="profilemodalvalue">{USER.department}</span>
          </div>
          <div className="profilemodalrow">
            <span className="profilemodallabel">Last Login</span>
            <span className="profilemodalvalue">{formatLastLogin()}</span>
          </div>
        </div>

        <div className="profilemodaldivider" />

        {/* Org info */}
        <div className="profilemodalsection">
          <div className="profilemodalsectiontitle">Organisation</div>
          <div className="profilemodalrow">
            <span className="profilemodallabel">Company</span>
            <span className="profilemodalvalue">{USER.company}</span>
          </div>
          <div className="profilemodalrow">
            <span className="profilemodallabel">Access Level</span>
            <span className="profilemodalvalue">{USER.accessLevel}</span>
          </div>
          <div className="profilemodalrow profilemodalrow-top">
            <span className="profilemodallabel">Subsidiaries</span>
            <div className="profilemodalchips">
              {USER.subsidiaries.map((s) => (
                <span key={s} className="profilemodalchip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="profilemodaldivider" />

        <div className="profilemodalfoot">
          <button className="profilemodalclosebtn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
