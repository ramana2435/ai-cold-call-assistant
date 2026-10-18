import { Call } from '../types';

interface CallCardProps {
  call: Call;
  onClick: () => void;
}

export default function CallCard({ call, onClick }: CallCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 24) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 2) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getLastStage = () => {
    if (call.stage_results && call.stage_results.length > 0) {
      const lastStage = call.stage_results[call.stage_results.length - 1];
      return `Stage ${lastStage.stage_number}`;
    }
    return 'OPENING';
  };

  const getStatusBadgeColor = () => {
    if (call.status === 'completed') return 'bg-gray-200 text-gray-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-5"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{call.prospect_name}</h3>
          <p className="text-gray-600">{call.company_name}</p>
          {call.prospect_role && <p className="text-sm text-gray-500">{call.prospect_role}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
            {getLastStage()}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
            {call.status === 'completed' ? 'Closed' : 'Active'}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{formatDate(call.created_at)}</span>
        {call.outcome && (
          <span className="text-gray-700 font-medium">
            {call.outcome.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </div>
  );
}
