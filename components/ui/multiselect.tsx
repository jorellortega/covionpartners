import React from "react"

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder }) => {
  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div className="relative border border-gray-700 rounded bg-gray-800 text-white p-2">
      <div className="mb-2 text-gray-400 text-sm">{placeholder}</div>
      <div className="flex flex-col gap-1">
        {options.map(option => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => handleToggle(option)}
              className="accent-purple-500"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
} 