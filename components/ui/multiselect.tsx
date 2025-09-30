import React from "react"

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder }) => {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div className="relative border border-gray-700 rounded bg-gray-800 text-white p-2">
      <div className="mb-2 text-gray-400 text-sm">{placeholder}</div>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {options.map(option => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="accent-purple-500"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
} 