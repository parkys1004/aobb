
import React from 'react';
import type { BlogPostData } from '../types';

const BlogResultsTable: React.FC<{ data: BlogPostData[] }> = ({ data }) => {
    return (
        <div className="bg-panel rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-raised/50 text-muted uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="p-3 text-left w-16">No.</th>
                            <th scope="col" className="p-3 text-left">블로그 제목</th>
                            <th scope="col" className="p-3 text-left">바로가기</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-raised/50 transition-colors duration-200">
                                <td className="p-3 text-muted text-center">{item.id}</td>
                                <td className="p-3 font-medium text-accent">{item.title}</td>
                                <td className="p-3">
                                    <a 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-muted hover:text-accent hover:underline transition-colors duration-200"
                                      aria-label={`${item.title} (새 탭에서 열기)`}
                                    >
                                        바로가기
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlogResultsTable;
