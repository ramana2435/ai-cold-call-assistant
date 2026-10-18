interface QuickTapButtonsProps {
  options: string[];
  selectedEvents: string[];
  onToggle: (event: string) => void;
}

export default function QuickTapButtons({ options, selectedEvents, onToggle }: QuickTapButtonsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = selectedEvents.includes(option);
        return (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
