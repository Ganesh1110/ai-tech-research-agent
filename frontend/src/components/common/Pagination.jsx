import React from "react"

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  showPageNumbers = true,
  showSummary = true,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 10)))
  const currentPage = Math.max(1, Math.min(page || 1, totalPages))

  const paginate = (newPage) => {
    const target = Math.max(1, Math.min(newPage, totalPages))
    if (target !== currentPage) {
      onPageChange(target)
    }
  }

  if (!total || totalPages <= 1) {
    return null
  }

  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  // Calculate windowed page numbers
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ]
  }

  const pages = getPageNumbers()

  const buttonBaseStyle = {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--border-subtle, #334155)",
    background: "var(--surface-card, #1e293b)",
    color: "var(--text-main, #f8fafc)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    height: 32,
    boxSizing: "border-box",
  }

  const disabledButtonStyle = {
    ...buttonBaseStyle,
    color: "var(--text-muted, #64748b)",
    cursor: "not-allowed",
    opacity: 0.5,
  }

  const activeButtonStyle = {
    ...buttonBaseStyle,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#ffffff",
    borderColor: "transparent",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 20,
        paddingTop: 16,
        borderTop: "1px solid var(--border-subtle, #334155)",
      }}
    >
      {/* Item Range Summary */}
      {showSummary && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted, #94a3b8)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Showing</span>
          <span style={{ fontWeight: 600, color: "var(--text-main, #f8fafc)" }}>
            {startItem}–{endItem}
          </span>
          <span>of</span>
          <span style={{ fontWeight: 600, color: "var(--text-main, #f8fafc)" }}>
            {total}
          </span>
          <span>items</span>
        </div>
      )}

      {/* Navigation Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {/* First Button */}
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === 1}
          style={currentPage === 1 ? disabledButtonStyle : buttonBaseStyle}
          title="First Page"
          aria-label="First Page"
        >
          «
        </button>

        {/* Prev Button */}
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          style={currentPage === 1 ? disabledButtonStyle : buttonBaseStyle}
          title="Previous Page"
          aria-label="Previous Page"
        >
          ‹ Prev
        </button>

        {/* Page Numbers */}
        {showPageNumbers &&
          pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: "0 4px",
                    color: "var(--text-muted, #64748b)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  …
                </span>
              )
            }
            const isCurrent = currentPage === p
            return (
              <button
                key={p}
                onClick={() => paginate(p)}
                style={isCurrent ? activeButtonStyle : buttonBaseStyle}
                aria-current={isCurrent ? "page" : undefined}
              >
                {p}
              </button>
            )
          })}

        {/* Next Button */}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={currentPage === totalPages ? disabledButtonStyle : buttonBaseStyle}
          title="Next Page"
          aria-label="Next Page"
        >
          Next ›
        </button>

        {/* Last Button */}
        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
          style={currentPage === totalPages ? disabledButtonStyle : buttonBaseStyle}
          title="Last Page"
          aria-label="Last Page"
        >
          »
        </button>
      </div>
    </div>
  )
}
