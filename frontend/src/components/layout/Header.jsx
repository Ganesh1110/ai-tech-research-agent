import React from "react"
import { SearchIcon, BellIcon, ClockIcon, PlayIcon, SquareIcon } from "../common/Icons"

export function Header({
  searchQuery,
  onSearchChange,
  isSchedulerRunning,
  onToggleScheduler,
  nextScanCountdown = "3m 45s",
  activeTabLabel = "Overview",
}) {
  return (
    <header className="header">
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(13, 19, 34, 0.85)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: "8px 14px",
          width: "420px",
          maxWidth: "45%",
          transition: "border-color 0.2s ease",
        }}
      >
        <SearchIcon size={16} color="var(--text-muted)" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search discoveries, technologies, or ask anything... (⌘ + K)"
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-main)",
            fontSize: 13,
            width: "100%",
          }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Autonomous Scheduler Status & Toggle */}
        <button
          onClick={onToggleScheduler}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: isSchedulerRunning
              ? "rgba(16, 185, 129, 0.12)"
              : "rgba(244, 63, 94, 0.12)",
            border: `1px solid ${isSchedulerRunning ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
            borderRadius: 20,
            padding: "5px 12px",
            color: isSchedulerRunning ? "var(--accent-emerald)" : "var(--accent-rose)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          title={isSchedulerRunning ? "Click to stop scheduler" : "Click to start autonomous scheduler"}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isSchedulerRunning ? "var(--accent-emerald)" : "var(--accent-rose)",
              boxShadow: isSchedulerRunning ? "0 0 8px #10b981" : "0 0 8px #f43f5e",
            }}
          />
          <span>{isSchedulerRunning ? "Autonomous Research Active" : "Scheduler Paused"}</span>
          {isSchedulerRunning ? (
            <SquareIcon size={10} color="var(--accent-emerald)" />
          ) : (
            <PlayIcon size={10} color="var(--accent-rose)" />
          )}
        </button>

        {/* Next Scan Countdown */}
        {isSchedulerRunning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: 12,
              color: "var(--text-dim)",
            }}
          >
            <ClockIcon size={13} color="var(--accent-cyan)" />
            <span>Next scan: <strong style={{ color: "var(--text-main)" }}>{nextScanCountdown}</strong></span>
          </div>
        )}

        {/* Notification Bell */}
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-dim)",
          }}
        >
          <BellIcon size={16} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--accent-rose)",
              color: "#ffffff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 8px rgba(244, 63, 94, 0.6)",
            }}
          >
            3
          </span>
        </div>

        {/* User Profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingLeft: 4,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed 0%, #00f0ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12,
              color: "#ffffff",
              boxShadow: "0 0 12px rgba(124, 58, 237, 0.4)",
            }}
          >
            GJ
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-main)",
              display: "none",
            }}
            className="user-name"
          >
            Ganesh JayaPrakash
          </span>
        </div>
      </div>
    </header>
  )
}
