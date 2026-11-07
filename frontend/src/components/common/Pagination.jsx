import React from "react"

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  showPageNumbers = true,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.max(1, Math.min(page, totalPages))

  const paginate = (newPage) => {
    const np = Math.max(1, Math.min(newPage, totalPages))
    if (np !== currentPage) onPageChange(np)
  }

  if (totalPages <= 1) return null

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 16,
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-card, #1e293b)",
          color: currentPage === 1 ? "var(--text-muted, #94a3b8)" : "var(--text-main)",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Prev
      </button>

      {showPageNumbers &&
        [...Array(totalPages)].map((_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => paginate(p)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle)",
                background:
                  currentPage === p
                    ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)"
                    : "var(--surface-card, #1e293b)",
                color: currentPage === p ? "#ffffff" : "var(--text-main)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {p}
            </button>
          )
        })}

      <span
        style={{
          fontSize: 12,
          color: "var(--text-muted, #94a3b8)",
          padding: "0 8px",
        }}
      >
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-card, #1e293b)",
          color: currentPage === totalPages ? "var(--text-muted, #94a3b8)" : "var(--text-main)",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Next
      </button>
    </div>
  )
}
