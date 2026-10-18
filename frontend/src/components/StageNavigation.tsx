import { STAGES } from '../constants/stages';

interface StageNavigationProps {
  currentStage: number;
  onStageClick: (stage: number) => void;
}

export default function StageNavigation({ currentStage, onStageClick }: StageNavigationProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">STAGES</h3>
      <div className="space-y-2">
        {STAGES.map((stage) => {
          const isCurrent = stage.number === currentStage;
          const isPast = stage.number < currentStage;
          
          return (
            <button
              key={stage.number}
              onClick={() => onStageClick(stage.number)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : isPast
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={stage.number > currentStage}
            >
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                  isCurrent ? 'bg-white text-blue-600' : ''
                }`}>
                  {stage.number}
                </span>
                <span className="text-sm">{stage.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
