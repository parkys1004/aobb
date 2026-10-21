
import React from 'react';
import type { KeywordData, Feature } from '../types';

interface ResultsTableProps {
    data: KeywordData[];
    onKeywordClick: (keyword: string) => void;
    onGenerateTopicsFromMain: () => void;
    onGenerateTopicsFromAll: () => void;
    loading: boolean;
    feature: Feature;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, onKeywordClick, onGenerateTopicsFromMain, onGenerateTopicsFromAll, loading, feature }) => {
    
    const handleKeywordClick = (keyword: string) => {
        onKeywordClick(keyword);
    };

    const getTitle = () => {
        if (feature === 'related-keywords') {
            return '관련 검색어 (Related Searches)';
        }
        return '자동완성검색어';
    };

    return (
        <div className="bg-panel rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-raised/50 text-muted uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="p-3 text-left w-16">No.</th>
                            <th scope="col" className="p-3 text-left">{getTitle()}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-raised/50 transition-colors duration-200">
                                <td className="p-3 text-muted text-center">{item.id}</td>
                                <td className="p-3 font-medium text-accent">
                                     <button 
                                        onClick={() => handleKeywordClick(item.keyword)}
                                        className="text-left w-full hover:underline focus:outline-none focus:ring-2 focus:ring-accent/40 rounded px-1"
                                        aria-label={`${item.keyword}로 검색하기`}
                                    >
                                        {item.keyword}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {feature === 'keywords' && (
                <div className="p-4 bg-panel border-t border-line flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onGenerateTopicsFromMain}
                        disabled={loading}
                        className="btn btn-primary flex-1"
                    >
                        메인키워드로만 주제 만들기
                    </button>
                    <button 
                        onClick={onGenerateTopicsFromAll}
                        disabled={loading}
                        className="btn btn-primary flex-1"
                    >
                        자동완성검색어 조합으로 주제 만들기
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResultsTable;
