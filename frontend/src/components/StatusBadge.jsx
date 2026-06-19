const configs = {
  pending:  { cls: 'badge-pending',  icon: '⏳', label: 'Pending'  },
  approved: { cls: 'badge-approved', icon: '✅', label: 'Approved' },
  rejected: { cls: 'badge-rejected', icon: '❌', label: 'Rejected' },
  released: { cls: 'badge-released', icon: '🔓', label: 'Released' },
  returned: { cls: 'badge-returned', icon: '↩️', label: 'Returned' },
  issued:   { cls: 'badge-approved', icon: '📤', label: 'Issued' },
  pending_return: { cls: 'badge-pending', icon: '↩️', label: 'Pending Return' },
  overdue:  { cls: 'badge-rejected', icon: '⚠️', label: 'Overdue' },
  damaged:  { cls: 'badge-rejected', icon: '🔨', label: 'Damaged' },
  lost:     { cls: 'badge-rejected', icon: '❌', label: 'Lost' },
  partially_returned: { cls: 'badge-returned', icon: '↩️', label: 'Partial Return' },
  late_return:        { cls: 'badge-rejected', icon: '⚠️', label: 'Late Return' },
  active:             { cls: 'badge-approved', icon: '🟢', label: 'Active Session' },
  completed:          { cls: 'badge-returned', icon: '🏁', label: 'Completed' },
  cancelled:          { cls: 'badge-rejected', icon: '❌', label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || { cls: 'badge-pending', icon: '❓', label: status };
  return (
    <span className={cfg.cls}>
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  );
}
