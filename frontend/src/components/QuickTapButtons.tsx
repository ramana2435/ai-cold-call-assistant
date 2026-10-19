interface QuickTapButtonsProps {
  options: string[];
  selectedEvents: string[];
  onToggle: (event: string) => void;
  disabled?: boolean;
}

export default function QuickTapButtons({ options, selectedEvents, onToggle, disabled = false }: QuickTapButtonsProps) {
  return (
    <div className="relative">
      {disabled && (
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Locked - View only</span>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedEvents.includes(option);
          return (
            <button
              key={option}
              onClick={() => !disabled && onToggle(option)}
              disabled={disabled}
              type="button"
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                isSelected
                  ? disabled 
                    ? 'bg-blue-200 text-blue-800 border-2 border-blue-300' 
                    : 'bg-blue-500 text-white'
                  : disabled
                    ? 'bg-gray-50 text-gray-500 border-2 border-gray-200'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
