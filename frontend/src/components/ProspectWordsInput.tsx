interface ProspectWordsInputProps {
  value: string;
  onChange: (value: string) => void;
  stageName: string;
}

export default function ProspectWordsInput({ value, onChange, stageName }: ProspectWordsInputProps) {
  const isStage5 = stageName === 'Their need, in their words';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        HER WORDS {isStage5 && <span className="text-blue-600">(Critical - Capture Exact Words)</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type the prospect's exact words here..."
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={5}
      />
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Capture prospect's exact words{isStage5 ? ', especially verbatim needs' : ''}</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}
