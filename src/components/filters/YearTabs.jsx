import React from 'react';

/**
 * YearTabs - Filter tabs for academic years based on department's total years.
 */
export default function YearTabs({
  yearsCount = 4,
  selectedYear = 'all',
  onSelectYear,
  studentCountsByYear = {},
}) {
  const tabs = [{ value: 'all', label: 'All Years' }];

  for (let i = 1; i <= yearsCount; i++) {
    const suffix = ['st', 'nd', 'rd', 'th'][Math.min(i - 1, 3)] || 'th';
    tabs.push({
      value: i,
      label: `${i}${suffix} Year`,
    });
  }

  return (
    <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar space-x-1 sm:space-x-2">
      {tabs.map((tab) => {
        const isSelected = String(selectedYear) === String(tab.value);
        const count =
          tab.value === 'all'
            ? Object.values(studentCountsByYear).reduce((a, b) => a + b, 0)
            : studentCountsByYear[tab.value] || 0;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSelectYear && onSelectYear(tab.value)}
            className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center space-x-2 ${
              isSelected
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
