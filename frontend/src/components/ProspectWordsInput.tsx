interface ProspectWordsInputProps {
  value: string;
  onChange: (value: string) => void;
  stageName: string;
  disabled?: boolean;
}

export default function ProspectWordsInput({ value, onChange, stageName, disabled = false }: ProspectWordsInputProps) {
  const isStage5 = stageName === 'Their need, in their words';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          HER WORDS {isStage5 && <span className="text-blue-600">(Critical - Capture Exact Words)</span>}
        </label>
        {disabled && (
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Locked
          </span>
        )}
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? "No data captured" : "Type the prospect's exact words here..."}
          className={`w-full px-4 py-3 rounded-lg focus:outline-none resize-none transition-colors ${
            disabled 
              ? 'bg-gray-50 border-2 border-gray-200 text-gray-600 cursor-not-allowed' 
              : 'bg-white border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }`}
          rows={5}
          disabled={disabled}
          readOnly={disabled}
        />
        {disabled && value === '' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm italic">No prospect words recorded</span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          {disabled 
            ? 'Saved prospect words' 
            : `Capture prospect's exact words${isStage5 ? ', especially verbatim needs' : ''}`
          }
        </span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}
