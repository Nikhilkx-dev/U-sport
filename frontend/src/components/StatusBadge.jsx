const configs = {
  pending:  { cls: 'badge-pending',  icon: '⏳', label: 'Pending'  },
  approved: { cls: 'badge-approved', icon: '✅', label: 'Approved' },
  rejected: { cls: 'badge-rejected', icon: '❌', label: 'Rejected' },
  released: { cls: 'badge-released', icon: '🔓', label: 'Released' },
  returned: { cls: 'badge-returned', icon: '↩️', label: 'Returned' },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || { cls: 'badge-pending', icon: '❓', label: status };
  return (
    <span className={cfg.cls}>
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  );
}
