import type { AccountStatus } from '../types/account';

interface StatusBadgeProps {
  status: AccountStatus;
}

const statusConfig: Record<AccountStatus, { label: string; className: string }> = {
  NOT_LOGGED_IN: {
    label: 'Not Logged In',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  LOGGED_IN: {
    label: 'Logged In',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  SESSION_EXPIRED: {
    label: 'Session Expired',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
